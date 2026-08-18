import { createApi as createHypercoreApi } from "@ledgerhq/coin-hypercore/api/index";
import type { CoinModuleApi } from "@ledgerhq/coin-module-framework/api/types";
import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";

// Config is resolved from the Context bound in getCoinModuleApi (framework v6), so createApi() takes none.
export function createLocalHypercoreApi(_currencyId: string): CoinModuleApi<any> & BridgeApi {
  return createHypercoreApi() as CoinModuleApi<any> & BridgeApi;
}
