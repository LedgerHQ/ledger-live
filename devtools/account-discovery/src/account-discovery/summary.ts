import type { AccountDiscoveryState, CompletionStatus, DiscoveredRow } from "../types";

export function formatDuration(ms: number): string {
  const rounded = Math.round(ms);
  return rounded < 1000 ? `${rounded} ms` : `${(ms / 1000).toFixed(1)} s`;
}

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;

/** What the scan found, what it cost, how long it took. */
export function summaryLine(state: AccountDiscoveryState): string {
  const used = state.rows.filter(row => row.used).length;
  const { derivations, statusReads } = state.counters;
  const time = state.elapsedMs === undefined ? "" : ` · ${formatDuration(state.elapsedMs)}`;
  return `${plural(used, "used account")} · ${plural(derivations, "derivation")}, ${plural(statusReads, "status read")}${time}`;
}

export function statusLine(state: AccountDiscoveryState): string {
  if (state.status === "idle") return "Pick a currency and scan.";
  if (state.status === "error") return state.error ?? "The scan failed.";
  const prefix = { scanning: "Scanning… ", stopped: "Stopped · ", done: "Done · " }[state.status];
  return `${prefix}${summaryLine(state)}`;
}

const COMPLETION_LABELS: Record<CompletionStatus, string> = {
  waiting: "waiting",
  "awaiting-approval": "approve on device",
  completed: "completed",
  refused: "refused",
  failed: "failed",
};

export function completionLabel(row: DiscoveredRow): string | undefined {
  if (!row.needsCompletion) return undefined;
  return row.completion ? COMPLETION_LABELS[row.completion] : "needs completion";
}

export function completionLine({ completion }: AccountDiscoveryState): string | undefined {
  if (completion.status === "idle") return undefined;
  if (completion.status === "error") return completion.error ?? "The completion failed.";
  const lines = {
    completing: "Completing…",
    done: "Completion done",
    stopped: "Completion stopped",
  };
  return lines[completion.status];
}
