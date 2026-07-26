import { createApi as createVechainApi } from "@ledgerhq/coin-vechain/api/index";
import type { CoinModuleApi } from "@ledgerhq/coin-module-framework/api/types";
import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";
import type { CurrencyConfig } from "@ledgerhq/coin-module-framework/config";
import { getCurrencyConfiguration } from "../../config";

export function createLocalVechainApi(currencyId: string): CoinModuleApi<any> & BridgeApi {
  return createVechainApi(
    () => getCurrencyConfiguration<CurrencyConfig>(currencyId),
    currencyId,
  ) as CoinModuleApi<any> & BridgeApi;
}
