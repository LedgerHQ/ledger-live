import { createApi as createHyperCoreApi } from "@ledgerhq/coin-hypercore/api/index";
import {
  DEFAULT_HYPERCORE_INFO_URL,
  HyperCoreCoinConfig,
} from "@ledgerhq/coin-hypercore/config";
import type { CoinModuleApi } from "@ledgerhq/coin-module-framework/api/types";
import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";
import { getCurrencyConfiguration } from "../../../../config";

const DEFAULT_HYPERCORE_CONFIG: HyperCoreCoinConfig = {
  status: { type: "active" },
  infoUrl: DEFAULT_HYPERCORE_INFO_URL,
};

export function createLocalHyperCoreApi(currencyId: string): CoinModuleApi<any> & BridgeApi {
  let config: HyperCoreCoinConfig;
  try {
    config = getCurrencyConfiguration<HyperCoreCoinConfig>(currencyId);
  } catch {
    config = DEFAULT_HYPERCORE_CONFIG;
  }
  return createHyperCoreApi(config, currencyId) as CoinModuleApi<any> & BridgeApi;
}
