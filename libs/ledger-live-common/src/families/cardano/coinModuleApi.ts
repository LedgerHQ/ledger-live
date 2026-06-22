import { createApi as createCardanoApi } from "@ledgerhq/coin-cardano/api/index";
import type { CoinModuleApi } from "@ledgerhq/coin-module-framework/api/types";
import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";
import { CardanoCoinConfig } from "@ledgerhq/coin-cardano/config";
import { getCurrencyConfiguration } from "../../config";

export function createLocalCardanoApi(currencyId: string): CoinModuleApi<any> & BridgeApi {
  return createCardanoApi(
    getCurrencyConfiguration<CardanoCoinConfig>(currencyId),
    currencyId,
  ) as CoinModuleApi<any> & BridgeApi;
}
