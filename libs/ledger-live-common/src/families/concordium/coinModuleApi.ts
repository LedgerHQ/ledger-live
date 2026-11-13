import { createApi as createConcordiumApi } from "@ledgerhq/coin-concordium/api/index";
import { notSupportedApi, type CoinModuleImpl } from "@ledgerhq/coin-module-framework/api/index";
import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";

// Concordium stays on its legacy bridge for every other read.
export function createLocalConcordiumApi(currencyId: string): CoinModuleImpl<any, any> & BridgeApi {
  const { getAccountStatus } = createConcordiumApi(currencyId);
  const api = { ...notSupportedApi(), getAccountStatus };
  return api;
}
