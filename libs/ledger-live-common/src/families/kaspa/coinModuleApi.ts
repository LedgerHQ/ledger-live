import { createApi as createKaspaApi } from "@ledgerhq/coin-kaspa/api/index";
import type { CoinModuleApi } from "@ledgerhq/coin-module-framework/api/types";
import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";

export function createLocalKaspaApi(_currencyId: string): CoinModuleApi<any> & BridgeApi {
  return createKaspaApi() as CoinModuleApi<any> & BridgeApi;
}
