import { createApi as createXrpApi } from "@ledgerhq/coin-xrp/api/index";
import { XrpCoinConfig } from "@ledgerhq/coin-xrp/config";
import type { CoinModuleApi } from "@ledgerhq/coin-module-framework/api/types";
import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";
import { getCurrencyConfiguration } from "../../config";

export function createLocalXrpApi(currencyId: string): CoinModuleApi<any> & BridgeApi {
  return createXrpApi(getCurrencyConfiguration<XrpCoinConfig>(currencyId)) as CoinModuleApi<any> &
    BridgeApi;
}
