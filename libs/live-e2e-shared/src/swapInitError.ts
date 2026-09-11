export type SwapInitLogEntry = { timestamp?: string; level?: string; text?: string };

/** Signatures of a failed swap initialization (QAA-1326). */
export const SWAP_INIT_ERROR_SIGNATURES = [
  "custom.exchange.swap",
  "CompleteExchangeError",
  "PayloadStepError",
  "FeeNotLoaded",
  "SWAP_NOT_CREATED_ERROR",
];

/**
 * Pull the swap-init failure out of captured logs, formatted for triage. Null when no entry carries
 * a signature. Backs the "⚠️ Swap-init error" attachment on both desktop and mobile.
 */
export function extractSwapInitError(entries: SwapInitLogEntry[]): string | null {
  const matches = entries.filter(entry =>
    SWAP_INIT_ERROR_SIGNATURES.some(signature => (entry.text ?? "").includes(signature)),
  );
  if (matches.length === 0) return null;

  const step = deriveSwapInitStep(matches);
  const body = inChronologicalOrder(matches).map(formatSwapInitEntry).join("\n\n");
  return step ? `Step: ${step}\n\n${body}` : body;
}

/** Desktop appends, mobile's webview store prepends, and two sources can be merged into one list. */
function inChronologicalOrder(matches: SwapInitLogEntry[]): SwapInitLogEntry[] {
  if (!matches.every(entry => entry.timestamp)) return matches;
  return [...matches].sort((a, b) => (a.timestamp ?? "").localeCompare(b.timestamp ?? ""));
}

function deriveSwapInitStep(matches: SwapInitLogEntry[]): string | null {
  const text = matches.map(entry => entry.text ?? "").join(" ");
  if (text.includes("PayloadStepError") || text.includes("swap002")) {
    return "PAYLOAD (Backend Swap Payload Retrieval)";
  }
  if (text.includes("CompleteExchangeError")) {
    const deviceStep = /"step"\s*:\s*"([^"]+)"/.exec(text)?.[1] ?? "INIT";
    return `device Exchange app (${deviceStep})`;
  }
  return null;
}

function formatSwapInitEntry(entry: SwapInitLogEntry): string {
  const text = entry.text ?? "";
  const header = `[${entry.timestamp ?? ""}] [${(entry.level ?? "log").toUpperCase()}]`;
  const jsonStart = text.indexOf("{");
  if (jsonStart === -1) {
    return `${header} ${stripConsoleStyling(text)}`;
  }

  const label = stripConsoleStyling(text.slice(0, jsonStart));
  const rawJson = text.slice(jsonStart);
  try {
    const pretty = JSON.stringify(dropStacks(JSON.parse(rawJson)), null, 2);
    return `${header} ${label}\n${pretty}`;
  } catch {
    return `${header} ${label} ${rawJson}`;
  }
}

/** Remove `%c` console format tokens and their CSS style arguments, keeping the label text. */
function stripConsoleStyling(text: string): string {
  return text
    .replaceAll("%c", "")
    .replace(/background:[^;]*;?/gi, "")
    .replace(/color:\s*#[0-9a-f]{3,8};?/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Minified renderer stacks are noise for triage. */
function dropStacks(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(dropStacks);
  }
  if (value !== null && typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      if (key === "stack") continue;
      result[key] = dropStacks(val);
    }
    return result;
  }
  return value;
}
