import { createApi as createCosmosApi } from "@ledgerhq/coin-cosmos/api/index";
import type { CoinModuleApi } from "@ledgerhq/coin-module-framework/api/types";
import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";
import type { CosmosCoinConfig } from "@ledgerhq/coin-cosmos/config";
import { getCurrencyConfiguration } from "../../config";

export function createLocalCosmosApi(currencyId: string): CoinModuleApi<any> & BridgeApi {
  const config = getCurrencyConfiguration<CosmosCoinConfig>(currencyId);
  return createCosmosApi(config, currencyId) as CoinModuleApi<any> & BridgeApi;
}
