import { createApi as createCardanoApi } from "@ledgerhq/coin-cardano/api/index";
import type { CoinModuleApi } from "@ledgerhq/coin-module-framework/api/types";
import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";

export function createLocalCardanoApi(currencyId: string): CoinModuleApi<any> & BridgeApi {
  return createCardanoApi(currencyId) as CoinModuleApi<any> & BridgeApi;
}
