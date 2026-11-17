import { createApi as createAleoApi } from "@ledgerhq/coin-aleo/api";
import { notSupportedApi, type CoinModuleImpl } from "@ledgerhq/coin-module-framework/api/index";
import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";

// Aleo reads its balance and history with the view key: they stay on its legacy bridge.
export function createLocalAleoApi(currencyId: string): CoinModuleImpl<any, any> & BridgeApi {
  const { getAccountStatus } = createAleoApi(currencyId);
  const api = { ...notSupportedApi(), getAccountStatus };
  return api;
}
