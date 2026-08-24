import { createApi as createCasperApi } from "@ledgerhq/coin-casper/api";
import type { CoinModuleApi } from "@ledgerhq/coin-module-framework/api/types";
import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";

// Config is resolved from the Context bound in getCoinModuleApi (framework v6), so createApi() takes none.
export function createLocalCasperApi(_currencyId: string): CoinModuleApi<any> & BridgeApi {
  return createCasperApi() as unknown as CoinModuleApi<any> & BridgeApi;
}
