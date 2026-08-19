import { createApi as createStacksApi } from "@ledgerhq/coin-stacks/api/index";
import type { CoinModuleApi } from "@ledgerhq/coin-module-framework/api/types";
import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";

// Config is resolved from the Context bound in getCoinModuleApi (framework v6), so createApi()
// takes none.
export function createLocalStacksApi(_currencyId: string): CoinModuleApi<any> & BridgeApi {
  // createStacksApi is typed with concrete <MemoNotSupported, StacksTxData> params, so widen
  // via `unknown` first, mirroring coin-celo's own local api.
  return createStacksApi() as unknown as CoinModuleApi<any> & BridgeApi;
}
