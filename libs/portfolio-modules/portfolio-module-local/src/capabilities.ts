import type { OptionalApiKey } from "@ledgerhq/coin-module-framework/api/impl";
import { PortfolioApiError } from "@ledgerhq/portfolio-module-framework";
import type { LocalNetwork } from "./types";

/**
 * Throws a `METHOD_NOT_ALLOWED` `PortfolioApiError` when the coin module of `network` does not
 * implement `method`: absent, or its `supports` says so (a `withDefaults` stub). A client then reads
 * a typed "unsupported" instead of the stub's plain `Error`.
 */
export function requireCapability(network: LocalNetwork, method: OptionalApiKey): void {
  const { coinModule, currencyId } = network;
  if (typeof coinModule[method] !== "function" || coinModule.supports?.(method) === false) {
    throw new PortfolioApiError(
      "METHOD_NOT_ALLOWED",
      `${method} is not supported on ${currencyId}`,
    );
  }
}
