import { createApi as createSolanaApi } from "@ledgerhq/coin-solana/api/index";
import type { CoinModuleApi } from "@ledgerhq/coin-module-framework/api/types";
import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";

export function createLocalSolanaApi(currencyId: string): CoinModuleApi<any> & BridgeApi {
  return createSolanaApi(currencyId) as CoinModuleApi<any> & BridgeApi;
}
