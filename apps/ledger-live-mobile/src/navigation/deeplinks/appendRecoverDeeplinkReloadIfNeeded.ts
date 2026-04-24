import { navigationRef } from "~/rootnavigation";
import { ScreenName } from "~/const";

const LEDGER_SCHEMES = new Set(["ledgerlive", "ledgerwallet"]);

/** Params not part of the Recover deeplink query identity (path + query). */
const EXCLUDED_FROM_RECOVER_DEEPLINK_QUERY_COMPARISON = new Set([
  "platform",
  "device",
  "fromOnboarding",
  "recoverDeeplinkAt",
  "date",
  /** Set by linking when resolving the manifest; email deeplinks often omit it. */
  "name",
]);

function sortedSearchComparableFromEntries(entries: Iterable<[string, string]>): string {
  return [...entries]
    .filter(([k]) => k !== "recoverDeeplinkAt")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");
}

function comparableQueryFromUrlSearchParams(searchParams: URLSearchParams): string {
  const pairs: [string, string][] = [];
  searchParams.forEach((value, key) => {
    pairs.push([key, value]);
  });
  return sortedSearchComparableFromEntries(pairs);
}

function coerceRouteParams(params: unknown): Record<string, unknown> | undefined {
  if (params === null || typeof params !== "object" || Array.isArray(params)) {
    return undefined;
  }
  return Object.fromEntries(Object.entries(params));
}

function comparableQueryFromRecoverRouteParams(
  params: Record<string, unknown> | undefined,
): string {
  if (!params) return "";
  const pairs: [string, string][] = [];
  for (const [key, value] of Object.entries(params)) {
    if (EXCLUDED_FROM_RECOVER_DEEPLINK_QUERY_COMPARISON.has(key)) continue;
    if (value === null || value === undefined) continue;
    if (typeof value === "object") continue;
    pairs.push([key, String(value)]);
  }
  return sortedSearchComparableFromEntries(pairs);
}

export type AppendRecoverDeeplinkReloadOptions = {
  getCurrentRoute?: () => { name: string; params?: Record<string, unknown> } | undefined;
  now?: () => number;
};

/**
 * When a Recover deeplink matches the screen already focused (same platform + same query),
 * React Navigation may not update the route; bump `recoverDeeplinkAt` so RecoverPlayer can
 * remount the webview (same pattern as desktop recover.handler + Player key).
 */
export function appendRecoverDeeplinkReloadIfNeeded(
  urlString: string,
  options?: AppendRecoverDeeplinkReloadOptions,
): string {
  let url: URL;
  try {
    url = new URL(urlString);
  } catch {
    return urlString;
  }

  const scheme = url.protocol.replace(/:$/, "");
  if (!LEDGER_SCHEMES.has(scheme) || url.hostname !== "recover") {
    return urlString;
  }

  const platform = url.pathname.replace(/^\//, "").split("/")[0];
  if (!platform) return urlString;

  const getCurrentRoute =
    options?.getCurrentRoute ?? (() => navigationRef.current?.getCurrentRoute());
  const route = getCurrentRoute();
  if (route?.name !== ScreenName.Recover) return urlString;

  const params = coerceRouteParams(route.params);
  const currentPlatform = params?.platform;
  if (typeof currentPlatform !== "string") return urlString;
  if (currentPlatform.toLowerCase() !== platform.toLowerCase()) return urlString;

  const incomingComparable = comparableQueryFromUrlSearchParams(url.searchParams);
  const currentComparable = comparableQueryFromRecoverRouteParams(params);
  if (incomingComparable !== currentComparable) return urlString;

  const now = options?.now?.() ?? Date.now();
  const next = new URL(urlString);
  next.searchParams.set("recoverDeeplinkAt", String(now));
  return next.toString();
}
