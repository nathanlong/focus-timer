<script lang="ts">
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher<{
    create: string;
  }>();

  let timerName = "";

  function handleSubmit() {
    if (timerName.trim()) {
      dispatch("create", timerName.trim());
      timerName = "";
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Enter") {
      handleSubmit();
    }
  }
</script>

<div class="create-timer">
  <div class="input-group">
    <input
      type="text"
      bind:value={timerName}
      on:keydown={handleKeydown}
      placeholder="Enter timer name..."
      maxlength="50"
    />
    <button on:click={handleSubmit} disabled={!timerName.trim()}>
      Create Timer
    </button>
  </div>
</div>

<style>
  .create-timer {
    width: 100%;
  }

  h3 {
    margin: 0 0 1rem 0;
  }

  .input-group {
    display: flex;
    gap: 0.5rem;
  }

  input {
    flex: 1;
    padding: 0.75rem;
    border-radius: 4px;
    font-size: 1rem;
  }

  input:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
  }

  button {
    padding: 0.75rem 1rem;
    border-radius: 4px;
    font-size: 1rem;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  button:hover:not(:disabled) {
    background: #0056b3;
  }

  button:disabled {
    background: var(--color-dark0);
    cursor: not-allowed;
  }
</style>
