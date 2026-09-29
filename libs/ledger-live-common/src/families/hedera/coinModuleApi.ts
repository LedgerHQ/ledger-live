import { createApi as createHederaApi } from "@ledgerhq/coin-hedera/api/index";
import type { CoinModuleImpl } from "@ledgerhq/coin-module-framework/api/index";
import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";

export function createLocalHederaApi(currencyId: string): CoinModuleImpl<any, any> & BridgeApi {
  return createHederaApi(currencyId) as CoinModuleImpl<any, any> & BridgeApi;
}
