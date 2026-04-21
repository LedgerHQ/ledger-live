import { createApi as createTronApi } from "@ledgerhq/coin-tron/api/index";
import { TronCoinConfig } from "@ledgerhq/coin-tron/config";
import type { AlpacaApi } from "@ledgerhq/coin-module-framework/api/types";
import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";
import { getCurrencyConfiguration } from "../../../config";

export function createApi(currencyId: string): AlpacaApi<any> & BridgeApi {
  return createTronApi(
    getCurrencyConfiguration<TronCoinConfig>(currencyId),
  ) as AlpacaApi<any> & BridgeApi;
}
