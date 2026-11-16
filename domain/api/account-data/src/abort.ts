/** The signal's reason, else an `AbortError`: not every runtime fills `reason` or has `DOMException`. */
export function abortReason(signal: AbortSignal): unknown {
  if (signal.reason !== undefined) return signal.reason;
  const error = new Error("Aborted");
  error.name = "AbortError";
  return error;
}
