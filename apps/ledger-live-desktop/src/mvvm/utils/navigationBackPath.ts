function getPathname(path: string): string {
  const withoutQuery = path.split("?")[0] ?? path;
  return withoutQuery.split("#")[0] ?? withoutQuery;
}

function getSearch(path: string): string {
  const queryIndex = path.indexOf("?");
  if (queryIndex < 0) return "";
  const hashIndex = path.indexOf("#", queryIndex);
  const end = hashIndex < 0 ? path.length : hashIndex;
  return path.slice(queryIndex, end);
}

function isSafeInAppPath(path: string): boolean {
  if (!path.startsWith("/") || path.length === 0) return false;
  if (path.includes("..")) return false;
  return true;
}

function isExcludedPathname(pathname: string, excludedPathnames: ReadonlySet<string>): boolean {
  for (const excluded of excludedPathnames) {
    if (pathname === excluded || pathname.startsWith(`${excluded}/`)) return true;
  }
  return false;
}

/** Resolves in-app path for a back action; ignores unknown or unsafe location state. */
export function parseNavigationBackPath(
  locationState: unknown,
  stateKey: string,
  excludedPathnames: ReadonlySet<string>,
): string | undefined {
  if (!locationState || typeof locationState !== "object") return undefined;
  if (!(stateKey in locationState)) return undefined;
  const raw: unknown = (locationState as Record<string, unknown>)[stateKey];
  if (typeof raw !== "string" || raw.length === 0) return undefined;
  if (!isSafeInAppPath(raw)) return undefined;
  const pathname = getPathname(raw);
  if (isExcludedPathname(pathname, excludedPathnames)) return undefined;
  return pathname + getSearch(raw);
}

export function buildNavigationBackState<K extends string>(
  stateKey: K,
  backPath: string,
): { state: Record<K, string> } {
  return { state: { [stateKey]: backPath } as Record<K, string> };
}
