import { createApi as createCasperApi } from "@ledgerhq/coin-casper/api";
import type { CoinModuleApi } from "@ledgerhq/coin-module-framework/api/types";
import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";

export function createLocalCasperApi(_currencyId: string): CoinModuleApi<any> & BridgeApi {
  return createCasperApi() as CoinModuleApi<any> & BridgeApi;
}
