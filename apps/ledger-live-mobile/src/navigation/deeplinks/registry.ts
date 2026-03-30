import { landingPageHandler } from "./handlers/landingPage";
import { marketHandler } from "./handlers/market";
import { assetHandler } from "./handlers/asset";
import { modularDrawerHandler } from "./handlers/modularDrawer";
import { earnHandler } from "./handlers/earn";
import { swapHandler } from "./handlers/swap";
import { walletHandler } from "./handlers/wallet";
import { discoverHandler } from "./handlers/discover";
import { myledgerHandler } from "./handlers/myledger";
import { defaultHandler } from "./handlers/default";
import type {
  DeeplinkHandler,
  ParsedDeeplink,
  HandlerContext,
  DeeplinkHandlerResult,
} from "./types";

/**
 * Maps URL hostnames to their dedicated handler.
 * Hostnames not present here fall through to `defaultHandler`.
 */
const registry: Record<string, DeeplinkHandler> = {
  "landing-page-large-mover": landingPageHandler,
  market: marketHandler,
  asset: assetHandler,
  receive: modularDrawerHandler,
  "add-account": modularDrawerHandler,
  earn: earnHandler,
  swap: swapHandler,
  wallet: walletHandler,
  portfolio: walletHandler,
  discover: discoverHandler,
  recover: discoverHandler,
  myledger: myledgerHandler,
};

/**
 * Looks up the handler for the parsed deeplink's hostname and executes it.
 * Falls back to `defaultHandler` for unknown routes.
 */
export function executeHandler(
  parsed: ParsedDeeplink,
  context: HandlerContext,
): DeeplinkHandlerResult {
  const handler = registry[parsed.hostname] ?? defaultHandler;
  return handler(parsed, context);
}
