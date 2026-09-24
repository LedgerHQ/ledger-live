import { createApi } from "@ledgerhq/coin-hedera/api/index";
import type { CoinModuleApi } from "@ledgerhq/coin-module-framework/api/types";
import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";

/**
 * Cast through `unknown`: the `coinModuleLoaders` registry type drops the `TxData` generic.
 * `createApi` takes the currency id for the mirror-node and hgraph endpoints.
 */
export function createLocalHederaApi(currencyId: string): CoinModuleApi<any> & BridgeApi {
  return createApi(currencyId) as unknown as CoinModuleApi<any> & BridgeApi;
}
