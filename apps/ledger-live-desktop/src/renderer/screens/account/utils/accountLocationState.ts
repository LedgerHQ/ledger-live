import { parseNavigationBackPath } from "LLD/utils/navigationBackPath";

const EXCLUDED_ACCOUNT_BACK_PATHNAMES = new Set<string>(["/account"]);

/** Resolves in-app path for Account back action; ignores unknown or unsafe state. */
export function parseAccountBackPath(locationState: unknown): string | undefined {
  return parseNavigationBackPath(locationState, "accountBackPath", EXCLUDED_ACCOUNT_BACK_PATHNAMES);
}
