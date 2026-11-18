import { createApi as createFilecoinApi } from "@ledgerhq/coin-filecoin/api";
import type { CoinModuleApi } from "@ledgerhq/coin-module-framework/api/types";
import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";

/**
 * Local (Alpaca) coin-module API of the filecoin family, for the generic coin framework.
 *
 * Filecoin is not listed in `genericCoinFrameworkFamilies.json`: the app keeps using the legacy
 * bridge. This entry lets the generic framework be driven against coin-filecoin's `createApi`
 * explicitly (coin-tester). Config is resolved from the Context bound in getCoinModuleApi.
 */
export function createLocalFilecoinApi(_currencyId: string): CoinModuleApi<any> & BridgeApi {
  return createFilecoinApi() as unknown as CoinModuleApi<any> & BridgeApi;
}
