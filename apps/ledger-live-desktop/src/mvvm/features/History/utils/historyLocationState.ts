import { parseNavigationBackPath } from "LLD/utils/navigationBackPath";

const EXCLUDED_HISTORY_BACK_PATHNAMES = new Set<string>(["/history"]);

/** Resolves in-app path for History back action; ignores unknown or unsafe state. */
export function parseHistoryBackPath(locationState: unknown): string | undefined {
  return parseNavigationBackPath(locationState, "historyBackPath", EXCLUDED_HISTORY_BACK_PATHNAMES);
}
