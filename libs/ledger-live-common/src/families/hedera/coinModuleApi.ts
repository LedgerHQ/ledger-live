import { createApi } from "@ledgerhq/coin-hedera/api/index";
import type { CoinModuleApi } from "@ledgerhq/coin-module-framework/api/types";
import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";

// coin-hedera's createApi return type includes `& BridgeApi`, but that intersection is dead: the
// framework sources the bridge api from the family loader (./bridge/api.ts), never from here.
export function createLocalHederaApi(currencyId: string): CoinModuleApi<any> & BridgeApi {
  return createApi(currencyId) as unknown as CoinModuleApi<any> & BridgeApi;
}
