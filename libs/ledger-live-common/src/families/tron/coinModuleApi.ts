import { createApi as createTronApi } from "@ledgerhq/coin-tron/api/index";
import { TronCoinConfig } from "@ledgerhq/coin-tron/config";
import type { CoinModuleApi } from "@ledgerhq/coin-module-framework/api/types";
import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";
import { getCurrencyConfiguration } from "../../config";

/**
 * `CoinModuleApi<any, any>` matches the heterogeneous `coinModuleLoaders` registry. coin-tron's real
 * signature is `CoinModuleApi<TronMemo, TronTxData>`; the precision is enforced inside the coin
 * module, and the `TronTxData` payload reaches it through `bridge/api.ts:buildIntentData`.
 */
export function createLocalTronApi(currencyId: string): CoinModuleApi<any, any> & BridgeApi {
  return createTronApi(getCurrencyConfiguration<TronCoinConfig>(currencyId)) as CoinModuleApi<
    any,
    any
  > &
    BridgeApi;
}
