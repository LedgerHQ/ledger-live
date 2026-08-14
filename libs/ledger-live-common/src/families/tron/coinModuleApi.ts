import { createApi as createTronApi } from "@ledgerhq/coin-tron/api/index";
import type { CoinModuleApi } from "@ledgerhq/coin-module-framework/api/types";
import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";

export function createLocalTronApi(_currencyId: string): CoinModuleApi<any> & BridgeApi {
  return createTronApi() as CoinModuleApi<any> & BridgeApi;
}
