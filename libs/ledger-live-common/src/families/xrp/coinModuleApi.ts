import { createApi as createXrpApi } from "@ledgerhq/coin-xrp/api";
import type { CoinModuleImpl } from "@ledgerhq/coin-module-framework/api/index";
import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";

// Config is resolved from the Context bound in getCoinModuleApi (framework v6), so createApi() takes none.
export function createLocalXrpApi(_currencyId: string): CoinModuleImpl<any, any> & BridgeApi {
  return createXrpApi() as CoinModuleImpl<any, any> & BridgeApi;
}
