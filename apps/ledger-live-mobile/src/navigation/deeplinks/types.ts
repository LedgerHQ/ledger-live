import type { getStateFromPath } from "@react-navigation/native";
import type { LiveAppManifest } from "@ledgerhq/live-common/platform/types";

/**
 * Parsed representation of an incoming deeplink URL.
 * Produced by `parseDeepLink` and consumed by handlers via the registry.
 */
export interface ParsedDeeplink {
  /** URL hostname — the "route type" (e.g. "earn", "market", "swap") */
  hostname: string;
  /** URL pathname (e.g. "/deposit" for ledgerlive://earn/deposit) */
  pathname: string;
  /** First path segment after the hostname (pathname.split("/")[1]) */
  platform: string;
  /** Raw URLSearchParams from the deeplink */
  searchParams: URLSearchParams;
  /** Query params as a plain object */
  query: Record<string, string>;
  /** The original path string passed to getStateFromPath */
  rawPath: string;
  /** The parsed URL object */
  url: URL;
}

/**
 * Runtime dependencies injected into every handler.
 * Keeps handlers pure and independently testable.
 */
export interface HandlerContext {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dispatch: (action: any) => any;
  config: Parameters<typeof getStateFromPath>[1];
  hasCompletedOnboarding: boolean;
  liveAppProviderInitialized: boolean;
  manifests: LiveAppManifest[];
  shouldDisplayMarketBanner: boolean;
  shouldDisplayWallet40MainNav: boolean;
}

/** Return type shared by all handlers — mirrors React Navigation's getStateFromPath */
export type DeeplinkHandlerResult = ReturnType<typeof getStateFromPath>;

/** Signature every handler must implement */
export type DeeplinkHandler = (
  parsed: ParsedDeeplink,
  context: HandlerContext,
) => DeeplinkHandlerResult;
