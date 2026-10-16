import { createApi as createSolanaApi } from "@ledgerhq/coin-solana/api/index";
import type { CoinModuleApi } from "@ledgerhq/coin-module-framework/api/types";
import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";

export function createLocalSolanaApi(currencyId: string): CoinModuleApi<any> & BridgeApi {
  // The module omits capabilities `CoinModuleApi` requires (withDefaults backfills them) and
  // implements `getAccountInfo`, which it declares optional: neither type overlaps the other, so
  // widen via `unknown`.
  return createSolanaApi(currencyId) as unknown as CoinModuleApi<any> & BridgeApi;
}
