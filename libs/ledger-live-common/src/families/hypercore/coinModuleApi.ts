import { createApi as createHypercoreApi } from "@ledgerhq/coin-hypercore/api/index";
import { HypercoreCoinConfig } from "@ledgerhq/coin-hypercore/config";
import type { CoinModuleApi } from "@ledgerhq/coin-module-framework/api/types";
import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";
import { getCurrencyConfiguration } from "../../config";

export function createLocalHypercoreApi(currencyId: string): CoinModuleApi<any> & BridgeApi {
  return createHypercoreApi(
    getCurrencyConfiguration<HypercoreCoinConfig>(currencyId),
  ) as CoinModuleApi<any> & BridgeApi;
}
