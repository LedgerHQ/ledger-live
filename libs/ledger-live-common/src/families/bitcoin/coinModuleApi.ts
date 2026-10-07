import { createApi as createBitcoinApi } from "@ledgerhq/coin-bitcoin/api/index";
import type { CoinModuleApi } from "@ledgerhq/coin-module-framework/api/types";
import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";

/**
 * Local (Alpaca) coin-module API of the bitcoin family, for the generic coin framework.
 *
 * Bitcoin is not listed in `genericCoinFrameworkFamilies.json`: the app keeps using the legacy
 * bridge. This entry lets the generic framework be driven against coin-bitcoin's single-address
 * `createApi` explicitly (coin-tester).
 */
export function createLocalBitcoinApi(currencyId: string): CoinModuleApi<any> & BridgeApi {
  return createBitcoinApi(currencyId) as unknown as CoinModuleApi<any> & BridgeApi;
}
