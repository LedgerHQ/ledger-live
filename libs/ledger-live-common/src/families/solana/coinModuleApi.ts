import { createApi as createSolanaApi } from "@ledgerhq/coin-solana/api/index";
import type { CoinModuleApi } from "@ledgerhq/coin-module-framework/api/types";
import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";

export function createLocalSolanaApi(): CoinModuleApi<any> & BridgeApi {
  return createSolanaApi() as CoinModuleApi<any> & BridgeApi;
}
