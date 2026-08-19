import { createApi as createStellarApi } from "@ledgerhq/coin-stellar/api/index";
import type { CoinModuleApi } from "@ledgerhq/coin-module-framework/api/types";
import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";

// Config is resolved from the Context bound in getCoinModuleApi (framework v6), so createApi() takes none.
export function createLocalStellarApi(_currencyId: string): CoinModuleApi<any> & BridgeApi {
  return createStellarApi() as CoinModuleApi<any> & BridgeApi;
}
