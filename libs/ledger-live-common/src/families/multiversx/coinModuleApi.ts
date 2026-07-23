import { createApi as createMultiversxApi } from "@ledgerhq/coin-multiversx/api";
import type { CoinModuleApi } from "@ledgerhq/coin-module-framework/api/types";
import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";
import type { MultiversXCoinConfig } from "@ledgerhq/coin-multiversx/config";
import { getCurrencyConfiguration } from "../../config";

export function createLocalMultiversxApi(currencyId: string): CoinModuleApi<any> & BridgeApi {
  return createMultiversxApi(
    getCurrencyConfiguration<MultiversXCoinConfig>(currencyId),
    currencyId,
  ) as CoinModuleApi<any> & BridgeApi;
}
