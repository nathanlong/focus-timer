<script lang="ts">
  import { settings } from "./stores";
  import type { FocusThresholds } from "./types";

  let error: string | null = null;

  function handleChange(field: keyof FocusThresholds, rawValue: string) {
    const value = parseInt(rawValue, 10);

    if (!Number.isInteger(value) || value < 1 || value > 120) {
      error = "All values must be whole numbers between 1 and 120.";
      $settings = { ...$settings };
      return;
    }

    const proposed = { ...$settings, [field]: value };

    if (proposed.lightMinutes >= proposed.focusMinutes) {
      error = "Light focus threshold must be less than focus threshold.";
      $settings = { ...$settings };
      return;
    }

    if (proposed.focusMinutes >= proposed.deepWorkMinutes) {
      error = "Focus threshold must be less than deep work threshold.";
      $settings = { ...$settings };
      return;
    }

    error = null;
    $settings = proposed;
  }
</script>

<div class="settings">
  <h2>Settings</h2>
  <label>
    Light focus (min)
    <input
      type="number"
      value={$settings.lightMinutes}
      on:change={(e) => handleChange("lightMinutes", e.currentTarget.value)}
    />
  </label>
  <label>
    Focus (min)
    <input
      type="number"
      value={$settings.focusMinutes}
      on:change={(e) => handleChange("focusMinutes", e.currentTarget.value)}
    />
  </label>
  <label>
    Deep work (min)
    <input
      type="number"
      value={$settings.deepWorkMinutes}
      on:change={(e) => handleChange("deepWorkMinutes", e.currentTarget.value)}
    />
  </label>
  {#if error}
    <p class="settings-error">{error}</p>
  {/if}
</div>

<style>
  .settings {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-top: auto;
  }

  h2 {
    font-size: 1rem;
    margin-bottom: 0.25rem;
  }

  label {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.85rem;
    color: var(--color-fg1);
  }

  input {
    width: 5rem;
    padding: 0.25rem 0.5rem;
    background: var(--color-bg1);
    border: 1px solid var(--color-dark1);
    color: var(--color-fg0);
    font-family: inherit;
  }

  .settings-error {
    color: var(--color-bright-red, #fb4934);
    font-size: 0.8rem;
    margin: 0;
  }
</style>
