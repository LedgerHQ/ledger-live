import { createApi as createCosmosApi } from "@ledgerhq/coin-cosmos/api/index";
import type { CoinModuleApi } from "@ledgerhq/coin-module-framework/api/types";
import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";

export function createLocalCosmosApi(currencyId: string): CoinModuleApi<any> & BridgeApi {
  return createCosmosApi(currencyId) as CoinModuleApi<any> & BridgeApi;
}
