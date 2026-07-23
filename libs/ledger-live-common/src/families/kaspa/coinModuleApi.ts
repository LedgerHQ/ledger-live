import { createApi as createKaspaApi } from "@ledgerhq/coin-kaspa/api/index";
import type { CoinModuleApi } from "@ledgerhq/coin-module-framework/api/types";
import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";
import { KaspaCoinConfig } from "@ledgerhq/coin-kaspa/config";
import { getCurrencyConfiguration } from "../../config";

export function createLocalKaspaApi(currencyId: string): CoinModuleApi<any> & BridgeApi {
  return createKaspaApi(
    getCurrencyConfiguration<KaspaCoinConfig>(currencyId),
    currencyId,
  ) as CoinModuleApi<any> & BridgeApi;
}
