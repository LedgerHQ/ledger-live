import { createApi as createSolanaApi } from "@ledgerhq/coin-solana/api/index";
import type { CoinModuleApi } from "@ledgerhq/coin-module-framework/api/types";
import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";
import { SolanaCoinConfig } from "@ledgerhq/coin-solana/config";
import { getCurrencyConfiguration } from "../../../../config";

export function createLocalSolanaApi(currencyId: string): CoinModuleApi<any> & BridgeApi {
  return createSolanaApi(
    getCurrencyConfiguration<SolanaCoinConfig>(currencyId),
    currencyId,
  ) as CoinModuleApi<any> & BridgeApi;
}
