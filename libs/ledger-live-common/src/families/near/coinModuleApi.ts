import { createApi as createNearApi } from "@ledgerhq/coin-near/api/index";
import type { CoinModuleApi } from "@ledgerhq/coin-module-framework/api/types";
import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";

export function createLocalNearApi(_currencyId: string): CoinModuleApi<any> & BridgeApi {
  return createNearApi() as CoinModuleApi<any> & BridgeApi;
}
