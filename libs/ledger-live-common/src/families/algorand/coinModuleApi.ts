import { createApi as createAlgorandApi } from "@ledgerhq/coin-algorand/api";
import type { CoinModuleImpl } from "@ledgerhq/coin-module-framework/api/index";
import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";

export function createLocalAlgorandApi(_currencyId: string): CoinModuleImpl<any, any> & BridgeApi {
  return createAlgorandApi() as CoinModuleImpl<any, any> & BridgeApi;
}
