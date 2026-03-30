import type { ParsedDeeplink } from "./types";

/**
 * Converts the raw path string (as received by React Navigation's getStateFromPath)
 * into a structured ParsedDeeplink object ready to be consumed by handlers.
 *
 * Example: "earn?action=stake&currencyId=ethereum"
 * → { hostname: "earn", pathname: "", platform: "", searchParams: ..., ... }
 */
export function parseDeepLink(path: string): ParsedDeeplink {
  const url = new URL(`ledgerwallet://${path}`);
  const { hostname, searchParams, pathname } = url;
  const query = Object.fromEntries(searchParams);
  const platform = pathname.split("/")[1] ?? "";

  return {
    hostname,
    pathname,
    platform,
    searchParams,
    query,
    rawPath: path,
    url,
  };
}
