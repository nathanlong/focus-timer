<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { Timer } from "./types";
  import { formatTime, longestInterval } from "./timerUtils";

  export let timer: Timer;
  export let isActive: boolean;
  export let index: number;

  const dispatch = createEventDispatcher<{
    start: void;
    stop: void;
    delete: void;
    subtract: { id: string; minutes: number };
    add: { id: string; minutes: number };
    rename: { id: string; newName: string };
  }>();

  let subtractMinutes = "";
  let showSubtract = false;
  let addMinutes = "";
  let showAdd = false;
  let isRenaming = false;
  let renameValue = "";
  let renameCommitted = false;

  function autoFocus(node: HTMLElement) {
    node.focus();
  }

  function handleNameDblClick() {
    isRenaming = true;
    renameValue = timer.name;
    renameCommitted = false;
  }

  function commitRename() {
    const trimmed = renameValue.trim();
    if (trimmed) {
      dispatch("rename", { id: timer.id, newName: trimmed });
    }
    isRenaming = false;
  }

  function handleRenameKeydown(event: KeyboardEvent) {
    if (event.key === "Enter") {
      renameCommitted = true;
      commitRename();
    } else if (event.key === "Escape") {
      renameCommitted = true;
      isRenaming = false;
    }
  }

  function handleRenameBlur() {
    if (!renameCommitted) {
      commitRename();
    }
    renameCommitted = false;
  }

  $: lastIntervalElapsed = timer.isRunning && timer.currentStartTime
    ? timer.currentElapsed - timer.totalElapsed
    : timer.intervals.length > 0
      ? timer.intervals[timer.intervals.length - 1].elapsed
      : 0;

  function handleStart() {
    dispatch("start");
  }

  function handleStop() {
    dispatch("stop");
  }

  function handleDelete() {
    if (confirm(`Are you sure you want to delete "${timer.name}"?`)) {
      dispatch("delete");
    }
  }

  function handleSubtract() {
    const minutes = parseInt(subtractMinutes, 10);
    if (minutes > 0) {
      dispatch("subtract", { id: timer.id, minutes });
      subtractMinutes = "";
      showSubtract = false;
    }
  }

  function handleAdd() {
    const minutes = parseInt(addMinutes, 10);
    if (minutes > 0) {
      dispatch("add", { id: timer.id, minutes });
      addMinutes = "";
      showAdd = false;
    }
  }
</script>

<div class="timer-card" class:active={isActive}>
  <div class="timer-index">{index + 1}</div>
  <div class="timer-header">
    {#if isRenaming}
      <input
        type="text"
        class="rename-input"
        bind:value={renameValue}
        use:autoFocus
        on:blur={handleRenameBlur}
        on:keydown={handleRenameKeydown}
        maxlength="50"
      />
    {:else}
      <h4 class="timer-name" title={timer.name} on:dblclick={handleNameDblClick}>{timer.name}</h4>
    {/if}
    <div class="timer-status">
      {#if timer.isRunning}
        <span class="status-indicator running">●</span>
        <span class="status-text">Running</span>
      {:else}
        <span class="status-indicator stopped">●</span>
        <span class="status-text">Stopped</span>
      {/if}
    </div>
  </div>
  

  <div class="timer-times">
    <div class="stat">
      <span class="stat-label">Total</span>
      <span class="stat-value">{formatTime(timer.currentElapsed)}</span>
    </div>
    <div class="stat">
      <span class="stat-label">Longest</span>
      <span class="stat-value">{formatTime(longestInterval(timer))}</span>
    </div>
    <div class="stat">
      <span class="stat-label">Session</span>
      <span class="stat-value">{formatTime(lastIntervalElapsed)}</span>
    </div>
  </div>

  <div class="timer-stats">
    <div class="stat">
      <span class="stat-label">Light</span>
      <span class="stat-value light-focus">{timer.lightCount}</span>
    </div>
    <div class="stat">
      <span class="stat-label">Focus</span>
      <span class="stat-value focus">{timer.focusCount}</span>
    </div>
    <div class="stat">
      <span class="stat-label">Deep</span>
      <span class="stat-value deep-work">{timer.deepWorkCount}</span>
    </div>
    <div class="stat">
      <span class="stat-label">Points</span>
      <span class="stat-value">{timer.focusPoints}</span>
    </div>
  </div>

  <div class="timer-stats timer-stats-single">
  </div>

  <div class="timer-controls">
    <div class="primary-controls">
      {#if timer.isRunning}
        <button class="btn btn-stop" on:click={handleStop}> Stop </button>
      {:else}
        <button class="btn btn-start" on:click={handleStart}> Start </button>
      {/if}
    </div>

    <div class="secondary-controls">
      <button
        class="btn btn-small"
        on:click={() => (showAdd = !showAdd)}
        disabled={timer.isRunning}
        title="Add time for late start"
      >
        ⏰+
      </button>
      <button
        class="btn btn-small"
        on:click={() => (showSubtract = !showSubtract)}
        disabled={timer.isRunning}
        title="Subtract time for disruptions"
      >
        ⏰-
      </button>
      <button
        class="btn btn-small btn-danger"
        on:click={handleDelete}
        title="Delete timer"
      >
        🗑️
      </button>
    </div>
  </div>

  {#if showAdd}
    <div class="add-section">
      <div class="add-controls">
        <input
          type="number"
          bind:value={addMinutes}
          placeholder="Minutes to add"
          min="1"
          max="999"
        />
        <button
          class="btn btn-small"
          on:click={handleAdd}
          disabled={!addMinutes || parseInt(addMinutes) <= 0}
        >
          Add
        </button>
        <button
          class="btn btn-small"
          on:click={() => {
            showAdd = false;
            addMinutes = "";
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  {/if}

  {#if showSubtract}
    <div class="subtract-section">
      <div class="subtract-controls">
        <input
          type="number"
          bind:value={subtractMinutes}
          placeholder="Minutes to subtract"
          min="1"
          max="999"
        />
        <button
          class="btn btn-small"
          on:click={handleSubtract}
          disabled={!subtractMinutes || parseInt(subtractMinutes) <= 0}
        >
          Subtract
        </button>
        <button
          class="btn btn-small"
          on:click={() => {
            showSubtract = false;
            subtractMinutes = "";
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  .timer-card {
    background: var(--color-dark1);
    border: 1px solid var(--color-dark2);
    border-radius: 8px;
    padding: 1.5rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    transition: all 0.2s ease;
    position: relative;
  }

  .timer-card.active {
    border-color: var(--color-bright-green);
    box-shadow: 0 2px 8px rgba(40, 167, 69, 0.3);
  }

  .timer-index {
    position: absolute;
    top: -1rem;
    left: -1rem;
    width: 2rem;
    aspect-ratio: 1/1;
    display: flex;
    justify-content: center;
    align-items: center;
    background: var(--color-dark0);
    border: 1px solid var(--color-dark2);
    border-radius: 100%;
    transition: border-color 0.2s ease;
  }

  .active .timer-index {
    border-color: var(--color-bright-green);
  }

  .timer-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    gap: 0.5rem;
  }

  .timer-name {
    margin: 0;
    font-size: 1.1rem;
    color: var(--color-light0);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 180px;
  }

  .timer-status {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .status-indicator {
    font-size: 0.8rem;
  }

  .status-indicator.running {
    color: var(--color-bright-green);
  }

  .status-indicator.stopped {
    color: var(--color-gray);
  }

  .status-text {
    font-size: 0.85rem;
    color: var(--color-gray);
  }

  .rename-input {
    flex: 1;
    padding: 0.2rem 0.4rem;
    border-radius: 4px;
    font-size: 1.1rem;
    font-weight: bold;
    background: var(--color-dark2);
    border: 1px solid var(--color-bright-blue);
    color: var(--color-light0);
    width: 100%;
  }

  .rename-input:focus {
    outline: none;
  }

  .timer-stats-single {
    grid-template-columns: 1fr;
  }

  .timer-times {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.5rem;
    margin-bottom: 1.5rem;
  }

  .timer-stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.5rem;
    margin-bottom: 1.5rem;
  }

  .stat-value.light-focus {
    color: var(--color-bright-yellow);
  }

  .stat-value.focus {
    color: var(--color-bright-blue);
  }

  .stat-value.deep-work {
    color: var(--color-bright-green);
  }

  .stat {
    text-align: center;
  }

  .stat-label {
    display: block;
    font-size: 0.85rem;
    color: var(--color-dark4);
    margin-bottom: 0.25rem;
  }

  .stat-value {
    display: block;
    font-size: 1.2rem;
    font-weight: bold;
    color: var(--color-light1);
  }

  .timer-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .primary-controls {
    flex: 1;
  }

  .secondary-controls {
    display: flex;
    gap: 0.5rem;
  }

  .btn {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    font-size: 0.9rem;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .btn-start {
    background: var(--color-bright-green);
    color: var(--color-dark0);
  }

  .btn-start:hover {
    background: #218838;
  }

  .btn-stop {
    background: #dc3545;
    color: white;
  }

  .btn-stop:hover {
    background: #c82333;
  }

  .btn-small {
    padding: 0.3rem 0.6rem;
    font-size: 0.8rem;
    background: var(--color-dark2);
    border: 1px solid var(--color-dark0);
    color: var(--color-light2);
  }

  .btn-small:hover:not(:disabled) {
    background: var(--color-bright-yellow);
  }

  .btn-small:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-danger {
    background: #dc3545;
    color: white;
    border-color: var(--color-dark0);
  }

  .btn-danger:hover:not(:disabled) {
    background: #c82333;
    border-color: #c82333;
  }

  .subtract-section {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #e9ecef;
  }

  .add-section {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #e9ecef;
  }

  .subtract-controls {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .add-controls {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .subtract-controls input,
  .add-controls input {
    flex: 1;
    padding: 0.3rem 0.6rem;
    border: 1px solid #dee2e6;
    border-radius: 4px;
    font-size: 0.85rem;
  }

  .subtract-controls input:focus,
  .add-controls input:focus {
    outline: none;
    border-color: #007bff;
  }
</style>
