import { createApi as createMultiversXApi } from "@ledgerhq/coin-multiversx/api";
import type { CoinModuleApi } from "@ledgerhq/coin-module-framework/api/types";
import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";

/**
 * Local Alpaca API for the generic coin framework. MultiversX resolves its
 * endpoints from `@ledgerhq/live-env` (no per-currency config needed), so the
 * currencyId is unused here. The `& BridgeApi` cast matches the registry's
 * `loadLocalApi` contract; the actual BridgeApi methods are provided separately
 * by `bridge/api.ts` (`loadBridgeApi`).
 */
export function createLocalMultiversXApi(_currencyId: string): CoinModuleApi<any> & BridgeApi {
  return createMultiversXApi() as CoinModuleApi<any> & BridgeApi;
}
