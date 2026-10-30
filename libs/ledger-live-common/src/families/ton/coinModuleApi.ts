import { createApi as createTonApi } from "@ledgerhq/coin-ton/api/index";
import type { CoinModuleApi } from "@ledgerhq/coin-module-framework/api/types";
import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";

/**
 * Local (Alpaca) coin-module API of the ton family, for the generic coin framework.
 *
 * TON is not listed in `genericCoinFrameworkFamilies.json`: the app keeps using the legacy bridge.
 * This entry lets the generic framework be driven against coin-ton's `createApi` explicitly
 * (coin-tester). Config is resolved from the Context bound in getCoinModuleApi.
 */
export function createLocalTonApi(_currencyId: string): CoinModuleApi<any> & BridgeApi {
  return createTonApi() as unknown as CoinModuleApi<any> & BridgeApi;
}
