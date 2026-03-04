<script lang="ts">
  import { timers } from "./stores";
  import { buildTimelineSegments, formatTime } from "./timerUtils";
  import type { TimelineSegment } from "./types";

  function formatClock(date: Date): string {
    const h = String(date.getHours()).padStart(2, "0");
    const m = String(date.getMinutes()).padStart(2, "0");
    return `${h}:${m}`;
  }

  function getSegmentClass(segment: TimelineSegment): string {
    if (segment.isGap) return "segment-gap";
    if (segment.type === "light-focus") return "segment-light-focus";
    if (segment.type === "focus") return "segment-focus";
    if (segment.type === "deep-work") return "segment-deep-work";
    return "segment-other";
  }

  function getTooltip(segment: TimelineSegment): string {
    const timeRange = `${formatClock(segment.start)}–${formatClock(segment.end)}`;
    if (segment.isGap) {
      return `Idle · ${formatTime(segment.durationMs)}`;
    }
    const typeLabel = segment.type ?? "session";
    return `${typeLabel} · ${formatTime(segment.durationMs)} · ${timeRange}`;
  }

  $: segments = buildTimelineSegments($timers, new Date());
  $: totalSpanMs =
    segments.length > 0
      ? segments[segments.length - 1].end.getTime() - segments[0].start.getTime()
      : 0;
</script>

{#if segments.length === 0}
  <div class="timeline-empty">No focus sessions recorded today.</div>
{:else}
  <div class="timeline-container">
    <div class="timeline-bar">
      {#each segments as segment}
        <div
          class="timeline-segment {getSegmentClass(segment)}"
          class:segment-active={segment.isActive}
          style="flex-basis: {totalSpanMs > 0 ? (segment.durationMs / totalSpanMs) * 100 : 0}%"
          title={getTooltip(segment)}
        ></div>
      {/each}
    </div>
    <div class="timeline-labels">
      <span class="timeline-label-start">{formatClock(segments[0].start)}</span>
      <span class="timeline-label-end">{formatClock(new Date())}</span>
    </div>
  </div>
{/if}

<style>
  .timeline-empty {
    text-align: center;
    color: var(--color-gray);
    padding: 1rem;
    font-size: 0.9rem;
  }

  .timeline-container {
    width: 100%;
    padding: 0.5rem 0;
  }

  .timeline-bar {
    display: flex;
    height: 24px;
    border-radius: 4px;
    overflow: hidden;
    width: 100%;
  }

  .timeline-segment {
    flex-shrink: 0;
    min-width: 2px;
  }

  .segment-light-focus {
    background: var(--color-bright-yellow);
  }

  .segment-focus {
    background: var(--color-bright-blue);
  }

  .segment-deep-work {
    background: var(--color-bright-green);
  }

  .segment-gap {
    background: var(--color-dark2);
    opacity: 0.4;
  }

  .segment-other {
    background: var(--color-gray);
  }

  .segment-active {
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.6;
    }
  }

  .timeline-labels {
    display: flex;
    justify-content: space-between;
    font-size: 0.75rem;
    color: var(--color-gray);
    margin-top: 0.25rem;
  }

  .timeline-label-start,
  .timeline-label-end {
    font-variant-numeric: tabular-nums;
  }
</style>
