import { createApi as createCantonApi } from "@ledgerhq/coin-canton/api/index";
import type { CoinModuleApi } from "@ledgerhq/coin-module-framework/api/types";
import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";

// Canton is single-chain; config is resolved from context.config() inside the module.
export function createLocalCantonApi(_currencyId: string): CoinModuleApi<any> & BridgeApi {
  return createCantonApi() as CoinModuleApi<any> & BridgeApi;
}
