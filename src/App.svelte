<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import TimerList from "./lib/TimerList.svelte";
  import CreateTimer from "./lib/CreateTimer.svelte";
  import type { Timer } from "./lib/types";

  let timers: Timer[] = [];
  let activeTimerId: string | null = null;
  let initialized = false;
  let totalFocusPoints = 0;

  // Configuration constants
  const FOCUS_CHUNK_MINUTES = 30; // Focus points are awarded for every 30 minutes
  const UPDATE_INTERVAL_MS = 5000; // Update every 5 seconds

  // Load timers from localStorage on mount
  onMount(() => {
    const savedTimers = localStorage.getItem("focus-timers");
    const savedActiveTimer = localStorage.getItem("active-timer-id");
    const savedTotalFocusPoints = localStorage.getItem("total-focus-points");

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

    if (savedTotalFocusPoints) {
      const parsedPoints = parseInt(savedTotalFocusPoints);
      totalFocusPoints = parsedPoints;
      countTotalFocusPoints();
      changeFavicon(totalFocusPoints)
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
    countTotalFocusPoints();
    localStorage.setItem("focus-timers", JSON.stringify(timers));
    console.log('reactive log')
  }

  $: if (activeTimerId !== null) {
    localStorage.setItem("active-timer-id", activeTimerId);
  } else {
    localStorage.removeItem("active-timer-id");
  }

  $: if (initialized && totalFocusPoints !== 0) {
    localStorage.setItem(
      "total-focus-points",
      JSON.stringify(totalFocusPoints)
    );
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
      currentElapsed: 0,
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
      changeFavicon(totalFocusPoints);
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
      timer.isRunning = false;
      timer.currentStartTime = null;

      if (activeTimerId === id) {
        activeTimerId = null;
        stopUpdateInterval();
      }

      changeFavicon(totalFocusPoints);
      updateCurrentElapsed(timer);
      calculateFocusPoints(timer);

      timers = [...timers];
    }
  }

  function subtractTime(id: string, minutes: number) {
    const timer = timers.find((t) => t.id === id);
    if (timer) {
      const msToSubtract = minutes * 60 * 1000;
      timer.totalElapsed = Math.max(0, timer.totalElapsed - msToSubtract);

      updateCurrentElapsed(timer)
      calculateFocusPoints(timer);

      timers = [...timers];
    }
  }

  function addTime(id: string, minutes: number) {
    const timer = timers.find((t) => t.id === id);
    if (timer) {
      const msToAdd = minutes * 60 * 1000;
      timer.totalElapsed += msToAdd;

      updateCurrentElapsed(timer)
      calculateFocusPoints(timer);

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

      updateCurrentElapsed(activeTimer)
      calculateFocusPoints(activeTimer);

      console.log('global interval')

      // Force reactivity update for active timer display
      timers = [...timers];
    }, UPDATE_INTERVAL_MS);
  }

  function updateCurrentElapsed(timer: Timer) {
    if (timer.isRunning && timer.currentStartTime) {
      console.log('running elasped', timer.id)
      const now = new Date().getTime();
      const sessionElapsed = now - timer.currentStartTime.getTime();
      timer.currentElapsed = timer.totalElapsed + sessionElapsed;
    } else {
      console.log('stopped elasped', timer.id)
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
    console.log('calc focus', timer.id)
    const focusChunkMs = FOCUS_CHUNK_MINUTES * 60 * 1000;

    if (timer.isRunning && timer.currentStartTime) {
      timer.focusPoints = Math.floor(timer.currentElapsed / focusChunkMs);
    } else {
      timer.focusPoints = Math.floor(timer.totalElapsed / focusChunkMs);
    }
  }

  function countTotalFocusPoints() {
    let count = 0;
    timers.forEach((timer) => {
      count += timer.focusPoints;
    });
    if (count !== totalFocusPoints) {
      changeFavicon(count);
    }
    totalFocusPoints = count;
  }

  function changeFavicon(count: number) {
    const color = activeTimerId ? "b8bb26" : "fb4934"
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
    <p>Total Focus: {totalFocusPoints}</p>
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
