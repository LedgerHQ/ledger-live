import { createApi as createCantonApi } from "@ledgerhq/coin-canton/api/index";
import { CantonCoinConfig } from "@ledgerhq/coin-canton/config";
import type { AlpacaApi } from "@ledgerhq/coin-module-framework/api/types";
import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";
import { getCurrencyConfiguration } from "../../../../config";

export function createLocalCantonApi(currencyId: string): AlpacaApi<any> & BridgeApi {
  return createCantonApi(getCurrencyConfiguration<CantonCoinConfig>(currencyId)) as AlpacaApi<any> &
    BridgeApi;
}
