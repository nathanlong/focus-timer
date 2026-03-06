<script lang="ts">
  let dialog: HTMLDialogElement;

  export function showModal() {
    dialog.showModal();
  }
</script>

<dialog
  id="shortcuts-dialog"
  bind:this={dialog}
  on:click={(e) => { if (e.target === dialog) dialog.close(); }}
>
  <div class="shortcuts-content">
    <div class="shortcuts-header">
      <h2>Keyboard Shortcuts</h2>
      <button commandfor="shortcuts-dialog" command="close">✕</button>
    </div>
    <table>
      <tbody>
        <tr>
          <td><kbd>1</kbd>–<kbd>9</kbd></td>
          <td>Start/stop timer at that index</td>
        </tr>
        <tr>
          <td><kbd>n</kbd></td>
          <td>Focus the new-timer input</td>
        </tr>
        <tr>
          <td><kbd>k</kbd></td>
          <td>Stop the running timer</td>
        </tr>
        <tr>
          <td><kbd>a</kbd> then <kbd>1</kbd>–<kbd>9</kbd></td>
          <td>Add 5 min to that timer</td>
        </tr>
        <tr>
          <td><kbd>s</kbd> then <kbd>1</kbd>–<kbd>9</kbd></td>
          <td>Subtract 5 min from that timer</td>
        </tr>
        <tr>
          <td><kbd>d</kbd> then <kbd>1</kbd>–<kbd>9</kbd></td>
          <td>Delete that timer</td>
        </tr>
        <tr>
          <td><kbd>?</kbd></td>
          <td>Show this dialog</td>
        </tr>
      </tbody>
    </table>
  </div>
</dialog>

<style>
  dialog {
    background: var(--color-dark0);
    color: var(--color-light1);
    border: 1px solid var(--color-dark1);
    padding: 0;
    min-width: 22rem;
    border-radius: 0.5rem;
  }

  dialog::backdrop {
    background: rgba(0, 0, 0, 0.6);
  }

  .shortcuts-content {
    padding: 1.25rem 1.5rem;
  }

  .shortcuts-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
  }

  h2 {
    font-size: 1rem;
    margin: 0;
  }

  .shortcuts-header button {
    background: none;
    border: none;
    color: var(--color-fg1);
    cursor: pointer;
    font-size: 1rem;
    padding: 0.25rem 0.5rem;
  }

  .shortcuts-header button:hover {
    color: var(--color-fg0);
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  tr + tr td {
    padding-top: 0.5rem;
  }

  td:first-child {
    padding-right: 1.5rem;
    white-space: nowrap;
  }

  kbd {
    display: inline-block;
    padding: 0.1rem 0.4rem;
    background: var(--color-bg0);
    border: 1px solid var(--color-dark1);
    border-radius: 3px;
    font-family: inherit;
    font-size: 0.85rem;
  }

  td:last-child {
    color: var(--color-fg1);
    font-size: 0.9rem;
  }
</style>
