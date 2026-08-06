import { createApi as createNearApi } from "@ledgerhq/coin-near/api/index";
import type { NearCoinConfig } from "@ledgerhq/coin-near/config";
import type { CoinModuleApi } from "@ledgerhq/coin-module-framework/api/types";
import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";
import { getCurrencyConfiguration } from "../../config";

export function createLocalNearApi(currencyId: string): CoinModuleApi<any> & BridgeApi {
  return createNearApi(
    () => getCurrencyConfiguration<ReturnType<NearCoinConfig>>(currencyId),
    currencyId,
  ) as CoinModuleApi<any> & BridgeApi;
}
