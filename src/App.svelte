<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import TimerList from "./lib/TimerList.svelte";
  import CreateTimer from "./lib/CreateTimer.svelte";
  import type { Timer } from "./lib/types";

  let timers: Timer[] = [];
  let activeTimerId: string | null = null;
  let initialized = false;

  // Configuration constants
  const FOCUS_CHUNK_MINUTES = 30; // Focus points are awarded for every 30 minutes
  const UPDATE_INTERVAL_MS = 5000; // Update every 5 seconds

  // Load timers from localStorage on mount
  onMount(() => {
    const savedTimers = localStorage.getItem("focus-timers");
    const savedActiveTimer = localStorage.getItem("active-timer-id");

    if (savedTimers) {
      const parsedTimers = JSON.parse(savedTimers);

      // Convert date strings back to Date objects
      timers = parsedTimers.map((timer: Timer) => ({
        ...timer,
        currentStartTime: timer.currentStartTime
          ? new Date(timer.currentStartTime)
          : null,
        intervals: timer.intervals.map((interval) => ({
          ...interval,
          start: new Date(interval.start),
          end: new Date(interval.end),
        })),
      }));
    }

    if (savedActiveTimer) {
      activeTimerId = savedActiveTimer;
      // Verify the active timer still exists and restart interval if it was running
      const activeTimer = timers.find((t) => t.id === savedActiveTimer);
      if (activeTimer && activeTimer.isRunning) {
        // Timer was running when page was refreshed, continue from where it left off
        startUpdateInterval();
      }
    }

    // Mark as initialized after loading is complete
    initialized = true;
  });

  // Cleanup interval on component destroy
  onDestroy(() => {
    stopUpdateInterval();
  });

  // Save timers to localStorage whenever they change (but only after initialization)
  $: if (initialized && timers.length >= 0) {
    localStorage.setItem("focus-timers", JSON.stringify(timers));
  }

  $: if (activeTimerId !== null) {
    localStorage.setItem("active-timer-id", activeTimerId);
  } else {
    localStorage.removeItem("active-timer-id");
  }

  function addTimer(name: string) {
    const newTimer: Timer = {
      id: crypto.randomUUID(),
      name,
      intervals: [],
      totalElapsed: 0,
      focusPoints: 0,
      isRunning: false,
      currentStartTime: null,
    };

    timers = [...timers, newTimer];
  }

  function deleteTimer(id: string) {
    if (activeTimerId === id) {
      activeTimerId = null;
      stopUpdateInterval();
    }
    timers = timers.filter((timer) => timer.id !== id);
  }

  function startTimer(id: string) {
    // Stop any currently running timer
    if (activeTimerId && activeTimerId !== id) {
      stopTimer(activeTimerId);
    }

    const timer = timers.find((t) => t.id === id);
    if (timer && !timer.isRunning) {
      timer.isRunning = true;
      timer.currentStartTime = new Date();
      activeTimerId = id;
      timers = [...timers];
      startUpdateInterval();
    }
  }

  function stopTimer(id: string) {
    const timer = timers.find((t) => t.id === id);
    if (timer && timer.isRunning && timer.currentStartTime) {
      const endTime = new Date();
      const elapsed = endTime.getTime() - timer.currentStartTime.getTime();

      timer.intervals.push({
        start: timer.currentStartTime,
        end: endTime,
        elapsed,
      });

      timer.totalElapsed += elapsed;

      // Calculate focus points
      const focusChunkMs = FOCUS_CHUNK_MINUTES * 60 * 1000;
      timer.focusPoints = Math.floor(timer.totalElapsed / focusChunkMs);

      timer.isRunning = false;
      timer.currentStartTime = null;

      if (activeTimerId === id) {
        activeTimerId = null;
        stopUpdateInterval();
      }

      timers = [...timers];
    }
  }

  function subtractTime(id: string, minutes: number) {
    const timer = timers.find((t) => t.id === id);
    if (timer) {
      const msToSubtract = minutes * 60 * 1000;
      timer.totalElapsed = Math.max(0, timer.totalElapsed - msToSubtract);

      // Recalculate focus points
      const focusChunkMs = 30 * 60 * 1000;
      timer.focusPoints = Math.floor(timer.totalElapsed / focusChunkMs);

      timers = [...timers];
    }
  }

  function addTime(id: string, minutes: number) {
    const timer = timers.find((t) => t.id === id);
    if (timer) {
      const msToAdd = minutes * 60 * 1000;
      timer.totalElapsed += msToAdd;

      // Recalculate focus points
      const focusChunkMs = FOCUS_CHUNK_MINUTES * 60 * 1000;
      timer.focusPoints = Math.floor(timer.totalElapsed / focusChunkMs);

      timers = [...timers];
    }
  }

  // Global update interval for active timers
  let globalUpdateInterval: number | null = null;

  function startUpdateInterval() {
    if (globalUpdateInterval) return; // Already running

    globalUpdateInterval = setInterval(() => {
      const activeTimer = timers.find(
        (t) => t.id === activeTimerId && t.isRunning
      );
      if (!activeTimer) {
        // No active timer, stop the interval
        if (globalUpdateInterval) {
          clearInterval(globalUpdateInterval);
          globalUpdateInterval = null;
        }
        return;
      }

      // Force reactivity update for active timer display
      timers = [...timers];
    }, UPDATE_INTERVAL_MS);
  }

  function stopUpdateInterval() {
    if (globalUpdateInterval) {
      clearInterval(globalUpdateInterval);
      globalUpdateInterval = null;
    }
  }
</script>

<main class="grid-template">
  <header class="header">
    <h1>Focus Timer</h1>
  </header>

  <div class="container">
    <CreateTimer on:create={(e) => addTimer(e.detail)} />

    <TimerList
      {timers}
      {activeTimerId}
      on:start={(e) => startTimer(e.detail)}
      on:stop={(e) => stopTimer(e.detail)}
      on:delete={(e) => deleteTimer(e.detail)}
      on:subtract={(e) => subtractTime(e.detail.id, e.detail.minutes)}
      on:add={(e) => addTime(e.detail.id, e.detail.minutes)}
    />
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
  }

  h1 {
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
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
