import {
  createApi as createTronApi,
  createSponsoredSendApi as createTronSponsoredApi,
} from "@ledgerhq/coin-tron/api/index";
import type { TronCoinConfig } from "@ledgerhq/coin-tron/config";
import type { CoinModuleApi } from "@ledgerhq/coin-module-framework/api/types";
import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";
import type { SponsoredCoinApi } from "../../bridge/generic-coin-framework/sponsored";
import { buildContext } from "../../bridge/generic-coin-framework/api/context";

/**
 * Cast to `CoinModuleApi<any, any>` to match the heterogeneous `coinModuleLoaders` registry
 * (`loadLocalApi`). coin-tron's real signature is `CoinModuleApi<TronCoinConfig, TronMemo, TronTxData>`;
 * the precision is enforced inside the coin module, and the `TronTxData` payload reaches it through
 * `bridge/api.ts:buildIntentData`. Config is resolved from the Context bound in `getCoinModuleApi`, so
 * `createApi()` takes none. The cast goes through `unknown` because the registry type drops the
 * `TxData` generic that only Tron carries, so the two do not structurally overlap.
 */
export function createLocalTronApi(_currencyId: string): CoinModuleApi<any, any> & BridgeApi {
  return createTronApi() as unknown as CoinModuleApi<any, any> & BridgeApi;
}

/** Cast through `unknown`: `SponsoredCoinApi` mirrors coin-tron's energy-rent types structurally. */
export function createLocalTronSponsoredApi(currencyId: string): SponsoredCoinApi {
  return createTronSponsoredApi(
    buildContext<TronCoinConfig>(currencyId),
  ) as unknown as SponsoredCoinApi;
}
