import { createApi as createStellarApi } from "@ledgerhq/coin-stellar/api/index";
import { StellarCoinConfig } from "@ledgerhq/coin-stellar/config";
import type { CoinModuleApi } from "@ledgerhq/coin-module-framework/api/types";
import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";
import { getCurrencyConfiguration } from "../../../../config";

export function createLocalStellarApi(currencyId: string): CoinModuleApi<any> & BridgeApi {
  return createStellarApi(
    getCurrencyConfiguration<StellarCoinConfig>(currencyId),
  ) as CoinModuleApi<any> & BridgeApi;
}
