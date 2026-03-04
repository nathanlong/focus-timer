<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import TimerList from "./lib/TimerList.svelte";
  import CreateTimer from "./lib/CreateTimer.svelte";
  import DayTimeline from "./lib/DayTimeline.svelte";
  import Settings from "./lib/Settings.svelte";
  import KeyboardShortcuts from "./lib/KeyboardShortcuts.svelte";
  import type { Timer, FocusThresholds } from "./lib/types";
  import { DEFAULT_THRESHOLDS } from "./lib/types";
  import { timers, activeTimerId, totalFocusPoints, settings } from "./lib/stores";
  import {
    computeIntervalPoints,
    sumFocusPoints,
    createTimer,
    deserializeTimers,
    classifyInterval,
    recalculateSegmentCounts,
    addTimeToTimer,
    subtractTimeFromTimer,
    isTypingInInput,
  } from "./lib/timerUtils";

  let initialized = false;
  let createTimerComponent: { focus(): void } | undefined;
  let shortcutsComponent: { showModal(): void } | undefined;

  // Configuration constants
  const UPDATE_INTERVAL_MS = 5000; // Update every 5 seconds
  const COMBO_TIMEOUT_MS = 1500;
  const SHORTCUT_ADJUST_MINUTES = 5;

  let pendingAction: "add" | "subtract" | "delete" | null = null;
  let comboTimeout: number | null = null;

  function isTypingInInputEvent(event: KeyboardEvent): boolean {
    return isTypingInInput(event.target);
  }

  function setPendingAction(action: "add" | "subtract" | "delete") {
    clearPendingAction();
    pendingAction = action;
    comboTimeout = setTimeout(clearPendingAction, COMBO_TIMEOUT_MS);
  }

  function clearPendingAction() {
    pendingAction = null;
    if (comboTimeout !== null) {
      clearTimeout(comboTimeout);
      comboTimeout = null;
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (isTypingInInputEvent(event)) return;

    const key = event.key;
    const num = parseInt(key, 10);

    if (num >= 1 && num <= 9) {
      const idx = num - 1;
      if (idx < $timers.length) {
        const timer = $timers[idx];
        if (pendingAction === "add") {
          addTime(timer.id, SHORTCUT_ADJUST_MINUTES);
          clearPendingAction();
        } else if (pendingAction === "subtract") {
          subtractTime(timer.id, SHORTCUT_ADJUST_MINUTES);
          clearPendingAction();
        } else if (pendingAction === "delete") {
          deleteTimer(timer.id);
          clearPendingAction();
        } else {
          if (timer.isRunning) {
            stopTimer(timer.id);
          } else {
            startTimer(timer.id);
          }
        }
      }
      return;
    }

    if (key === "n") {
      event.preventDefault();
      createTimerComponent?.focus();
      return;
    }

    if (key === "k") {
      if ($activeTimerId) {
        stopTimer($activeTimerId);
      }
      return;
    }

    if (key === "a") {
      setPendingAction("add");
      return;
    }

    if (key === "s") {
      setPendingAction("subtract");
      return;
    }

    if (key === "d") {
      setPendingAction("delete");
      return;
    }

    if (key === "?") {
      shortcutsComponent?.showModal();
      return;
    }
  }

  // Load timers from localStorage on mount
  onMount(() => {
    const savedTimers = localStorage.getItem("focus-timers");
    const savedActiveTimer = localStorage.getItem("active-timer-id");
    const savedTotalFocusPoints = localStorage.getItem("total-focus-points");
    const savedSettings = localStorage.getItem("focus-settings");

    if (savedSettings) {
      try {
        $settings = { ...DEFAULT_THRESHOLDS, ...JSON.parse(savedSettings) };
      } catch {
        // fall back to defaults
      }
    }

    if (savedTimers) {
      $timers = deserializeTimers(JSON.parse(savedTimers));
    }

    if (savedActiveTimer) {
      $activeTimerId = savedActiveTimer;
      // Verify the active timer still exists and restart interval if it was running
      const activeTimer = $timers.find((t) => t.id === savedActiveTimer);
      if (activeTimer && activeTimer.isRunning) {
        // Timer was running when page was refreshed, continue from where it left off
        updateCurrentElapsed(activeTimer);
        calculateFocusPoints(activeTimer);
        startUpdateInterval();
        $timers = [...$timers];
      }
    }

    if (savedTotalFocusPoints) {
      const parsedPoints = parseInt(savedTotalFocusPoints, 10);
      $totalFocusPoints = parsedPoints;
      countTotalFocusPoints();
      changeFavicon($totalFocusPoints);
    }

    window.addEventListener("keydown", handleKeydown);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleWindowFocus);

    // Mark as initialized after loading is complete
    initialized = true;
  });

  // Cleanup interval on component destroy
  onDestroy(() => {
    stopUpdateInterval();
    window.removeEventListener("keydown", handleKeydown);
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    window.removeEventListener("focus", handleWindowFocus);
    clearPendingAction();
  });

  // Save timers to localStorage whenever they change (but only after initialization)
  $: if (initialized && $timers.length >= 0) {
    countTotalFocusPoints();
    localStorage.setItem("focus-timers", JSON.stringify($timers));
  }

  // Save settings and recalculate segment counts when settings change
  $: if (initialized) {
    onSettingsUpdate($settings);
  }

  function onSettingsUpdate(s: FocusThresholds) {
    localStorage.setItem("focus-settings", JSON.stringify(s));
    for (const t of $timers) {
      recalculateSegmentCounts(t, s);
      calculateFocusPoints(t);
    }
    $timers = [...$timers];
  }

  $: if ($activeTimerId !== null) {
    localStorage.setItem("active-timer-id", $activeTimerId);
  } else {
    localStorage.removeItem("active-timer-id");
  }

  $: if (initialized && $totalFocusPoints !== 0) {
    localStorage.setItem(
      "total-focus-points",
      JSON.stringify($totalFocusPoints)
    );
  }

  function addTimer(name: string) {
    if (!name || name.length > 50) return;
    $timers = [...$timers, createTimer(name)];
  }

  function deleteTimer(id: string) {
    if ($activeTimerId === id) {
      $activeTimerId = null;
      stopUpdateInterval();
    }
    $timers = $timers.filter((timer) => timer.id !== id);
  }

  function startTimer(id: string) {
    // Stop any currently running timer
    if ($activeTimerId && $activeTimerId !== id) {
      stopTimer($activeTimerId);
    }

    const timer = $timers.find((t) => t.id === id);
    if (timer && !timer.isRunning) {
      timer.isRunning = true;
      timer.currentStartTime = new Date();
      $activeTimerId = id;
      $timers = [...$timers];
      changeFavicon($totalFocusPoints);
      startUpdateInterval();
    }
  }

  function stopTimer(id: string) {
    const timer = $timers.find((t) => t.id === id);
    if (timer && timer.isRunning && timer.currentStartTime) {
      const endTime = new Date();
      const elapsed = endTime.getTime() - timer.currentStartTime.getTime();

      timer.intervals.push({
        start: timer.currentStartTime,
        end: endTime,
        elapsed,
        type: classifyInterval(elapsed, $settings),
      });

      timer.totalElapsed += elapsed;
      timer.isRunning = false;
      timer.currentStartTime = null;

      if ($activeTimerId === id) {
        $activeTimerId = null;
        stopUpdateInterval();
      }

      recalculateSegmentCounts(timer, $settings);
      changeFavicon($totalFocusPoints);
      updateCurrentElapsed(timer);
      calculateFocusPoints(timer);

      $timers = [...$timers];
    }
  }

  function subtractTime(id: string, minutes: number) {
    const timer = $timers.find((t) => t.id === id);
    if (timer) {
      subtractTimeFromTimer(timer, minutes * 60 * 1000);
      recalculateSegmentCounts(timer, $settings);
      updateCurrentElapsed(timer);
      calculateFocusPoints(timer);
      $timers = [...$timers];
    }
  }

  function addTime(id: string, minutes: number) {
    const timer = $timers.find((t) => t.id === id);
    if (timer) {
      addTimeToTimer(timer, minutes * 60 * 1000);
      recalculateSegmentCounts(timer, $settings);
      updateCurrentElapsed(timer);
      calculateFocusPoints(timer);
      $timers = [...$timers];
    }
  }

  function renameTimer(id: string, newName: string) {
    const timer = $timers.find((t) => t.id === id);
    if (timer) {
      timer.name = newName;
      $timers = [...$timers];
    }
  }

  // Global update interval for active timers
  let globalUpdateInterval: number | null = null;

  function startUpdateInterval() {
    if (globalUpdateInterval) return; // Already running

    globalUpdateInterval = setInterval(() => {
      const activeTimer = $timers.find(
        (t) => t.id === $activeTimerId && t.isRunning
      );
      if (!activeTimer) {
        // No active timer, stop the interval
        if (globalUpdateInterval) {
          clearInterval(globalUpdateInterval);
          globalUpdateInterval = null;
        }
        return;
      }

      updateCurrentElapsed(activeTimer)
      calculateFocusPoints(activeTimer);

      // Force reactivity update for active timer display
      $timers = [...$timers];
    }, UPDATE_INTERVAL_MS);
  }

  function updateCurrentElapsed(timer: Timer) {
    if (timer.isRunning && timer.currentStartTime) {
      const now = new Date().getTime();
      const sessionElapsed = now - timer.currentStartTime.getTime();
      timer.currentElapsed = timer.totalElapsed + sessionElapsed;
    } else {
      timer.currentElapsed = timer.totalElapsed;
    }
  }

  function stopUpdateInterval() {
    if (globalUpdateInterval) {
      clearInterval(globalUpdateInterval);
      globalUpdateInterval = null;
    }
  }

  function calculateFocusPoints(timer: Timer) {
    const intervalElapsedMs = timer.intervals.reduce((sum, i) => sum + i.elapsed, 0);
    const completedPoints = timer.intervals.reduce(
      (sum, i) => sum + computeIntervalPoints(i.elapsed, $settings), 0
    );
    const manualMs = Math.max(0, timer.totalElapsed - intervalElapsedMs);

    if (timer.isRunning && timer.currentStartTime) {
      const currentMs = Date.now() - timer.currentStartTime.getTime();
      timer.focusPoints =
        completedPoints + computeIntervalPoints(manualMs, $settings) + computeIntervalPoints(currentMs, $settings);
    } else {
      timer.focusPoints = completedPoints + computeIntervalPoints(manualMs, $settings);
    }
  }

  function countTotalFocusPoints() {
    const count = sumFocusPoints($timers);
    if (count !== $totalFocusPoints) {
      changeFavicon(count);
    }
    $totalFocusPoints = count;
  }

  function refreshRunningTimer() {
    const runningTimer = $timers.find((t) => t.isRunning);
    if (!runningTimer) return;

    // Re-sync activeTimerId in case it drifted (tab discard / BFCache edge case)
    if ($activeTimerId !== runningTimer.id) {
      $activeTimerId = runningTimer.id;
    }

    updateCurrentElapsed(runningTimer);
    calculateFocusPoints(runningTimer);
    startUpdateInterval(); // no-op if already running
    $timers = [...$timers];
  }

  function handleVisibilityChange() {
    if (document.visibilityState === "visible") {
      refreshRunningTimer();
    }
  }

  function handleWindowFocus() {
    refreshRunningTimer();
  }

  function changeFavicon(count: number) {
    const color = $activeTimerId ? "b8bb26" : "fb4934"
    let link = document.createElement("link");
    let oldLink = document.getElementById("dynamic-favicon");
    link.id = "dynamic-favicon";
    link.rel = "shortcut icon";
    link.type = "image/svg+xml"
    link.href = emojiToSVG(count, color);
    if (oldLink) {
      document.head.removeChild(oldLink);
    }
    document.head.appendChild(link);
  }

  function emojiToSVG(text: number, color: string) {
    return `data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22256%22 height=%22256%22 viewBox=%220 0 100 100%22><text x=%2250%%22 y=%2250%%22 dominant-baseline=%22central%22 text-anchor=%22middle%22 font-size=%2280%22%20style%3D%22font-family%3A%20Arial%3B%20font-weight%3A%20bold%3B%20fill%3A%20%23${color}%3B%22>${text}</text></svg>`
  }
</script>

<main class="grid-template">
  <header class="header">
    <h1>Focus Timer</h1>
    <p>Total Focus: {$totalFocusPoints}</p>
    <button commandfor="shortcuts-dialog" command="show-modal" class="shortcuts-btn">Shortcuts</button>
    <KeyboardShortcuts bind:this={shortcutsComponent} />
    <Settings />
  </header>

  <div class="container">
    <CreateTimer bind:this={createTimerComponent} on:create={(e) => addTimer(e.detail)} />

    <TimerList
      timers={$timers}
      activeTimerId={$activeTimerId}
      on:start={(e) => startTimer(e.detail)}
      on:stop={(e) => stopTimer(e.detail)}
      on:delete={(e) => deleteTimer(e.detail)}
      on:subtract={(e) => subtractTime(e.detail.id, e.detail.minutes)}
      on:add={(e) => addTime(e.detail.id, e.detail.minutes)}
      on:rename={(e) => renameTimer(e.detail.id, e.detail.newName)}
    />

    <DayTimeline />
  </div>
</main>

<style>
  main {
    margin: 0 auto;
    text-align: center;
  }

  .header {
    grid-area: sidebar;
    border-left: 1px solid var(--color-dark1);
    padding: 1rem;
    display: flex;
    flex-direction: column;
  }

  h1 {
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
  }

  .shortcuts-btn {
    display: block;
    margin-top: 0.5rem;
    background: none;
    border: 1px solid var(--color-dark1);
    color: var(--color-fg1);
    cursor: pointer;
    font-family: inherit;
    font-size: 0.85rem;
    padding: 0.25rem 0.75rem;
    width: 100%;
  }

  .shortcuts-btn:hover {
    color: var(--color-fg0);
    border-color: var(--color-fg1);
  }

  .container {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
    align-items: center;
    grid-area: content;
  }
</style>
