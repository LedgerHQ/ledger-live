import type { ReadStatus } from "../types";

/** Seconds since a time in ms, or `undefined` when there is nothing to age. */
export function ageSeconds(at: number | undefined, now = Date.now()): number | undefined {
  return at === undefined ? undefined : Math.max(0, Math.round((now - at) / 1000));
}

/** Who answered and how long ago, or the error of the last read. */
export function statusLine(status: ReadStatus | undefined, now = Date.now()): string {
  if (!status) return "nothing stored";
  if (status.error) return status.error;
  if (status.pending) return "reading…";
  if (!status.sourceId) return "not read yet";
  const age = ageSeconds(status.readAt, now);
  const served =
    age === undefined
      ? `served by ${status.sourceId}`
      : `served by ${status.sourceId} · ${age}s ago`;
  return status.nextCursor === undefined ? served : `${served} · next cursor ${status.nextCursor}`;
}
