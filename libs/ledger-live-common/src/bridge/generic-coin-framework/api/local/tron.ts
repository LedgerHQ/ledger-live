import { createApi as createTronApi } from "@ledgerhq/coin-tron/api/index";
import { TronCoinConfig } from "@ledgerhq/coin-tron/config";
import type { CoinModuleApi } from "@ledgerhq/coin-module-framework/api/types";
import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";
import { getCurrencyConfiguration } from "../../../../config";

export function createLocalTronApi(currencyId: string): CoinModuleApi<any> & BridgeApi {
  return createTronApi(getCurrencyConfiguration<TronCoinConfig>(currencyId)) as CoinModuleApi<any> &
    BridgeApi;
}
