/** Passed when opening History from asset detail scoped transactions. */
export type HistoryLocationState = Readonly<{
  historyBackPath?: string;
}>;

function isAllowedHistoryBackPath(path: string): boolean {
  return path === "/asset" || path.startsWith("/asset/");
}

/** Resolves in-app path for History back action; ignores unknown state. */
export function parseHistoryBackPath(locationState: unknown): string | undefined {
  if (!locationState || typeof locationState !== "object") return undefined;
  if (!("historyBackPath" in locationState)) return undefined;
  const raw = locationState.historyBackPath;
  if (typeof raw !== "string" || raw.length === 0 || !raw.startsWith("/")) return undefined;
  if (!isAllowedHistoryBackPath(raw)) return undefined;
  return raw;
}
