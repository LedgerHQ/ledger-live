import { createApi as createMultiversxApi } from "@ledgerhq/coin-multiversx/api";
import type { CoinModuleApi } from "@ledgerhq/coin-module-framework/api/types";
import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";

export function createLocalMultiversxApi(_currencyId: string): CoinModuleApi<any> & BridgeApi {
  return createMultiversxApi() as CoinModuleApi<any> & BridgeApi;
}
