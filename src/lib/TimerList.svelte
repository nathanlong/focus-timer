<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import TimerCard from "./TimerCard.svelte";
  import type { Timer } from "./types";

  export let timers: Timer[];
  export let activeTimerId: string | null;

  const dispatch = createEventDispatcher<{
    start: string;
    stop: string;
    delete: string;
    subtract: { id: string; minutes: number };
    add: { id: string; minutes: number };
  }>();

  function handleStart(id: string) {
    dispatch("start", id);
  }

  function handleStop(id: string) {
    dispatch("stop", id);
  }

  function handleDelete(id: string) {
    dispatch("delete", id);
  }

  function handleSubtract(event: CustomEvent<{ id: string; minutes: number }>) {
    dispatch("subtract", event.detail);
  }

  function handleAdd(event: CustomEvent<{ id: string; minutes: number }>) {
    dispatch("add", event.detail);
  }
</script>

<div class="timer-list">
  {#if timers.length === 0}
    <div class="empty-state">
      <p>No timers yet. Create your first timer above!</p>
    </div>
  {:else}
    <h3>Your Timers ({timers.length})</h3>
    <div class="timers-grid">
      {#each timers as timer (timer.id)}
        <TimerCard
          {timer}
          isActive={activeTimerId === timer.id}
          on:start={() => handleStart(timer.id)}
          on:stop={() => handleStop(timer.id)}
          on:delete={() => handleDelete(timer.id)}
          on:subtract={handleSubtract}
          on:add={handleAdd}
        />
      {/each}
    </div>
  {/if}
</div>

<style>
  .timer-list {
    width: 100%;
  }

  .empty-state {
    text-align: center;
    padding: 2rem;
    font-style: italic;
  }

  h3 {
    margin-bottom: 1rem;
    text-align: left;
  }

  .timers-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1rem;
  }

  @media (max-width: 640px) {
    .timers-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
