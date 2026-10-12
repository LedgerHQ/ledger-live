import { createApi as createBitcoinApi } from "@ledgerhq/coin-bitcoin/api";
import type { BitcoinCoinConfig } from "@ledgerhq/coin-bitcoin/api";
import { walletBtcCurrencyById } from "@ledgerhq/coin-bitcoin/walletBtcCurrency";
import type { CoinModuleApi } from "@ledgerhq/coin-module-framework/api/types";
import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";
import { getCurrencyConfiguration } from "../../config";

/**
 * The explorer endpoint is injected (as wallet-btc's is): the resolution — endpoint and explorer
 * id, regtest included — stays the one the Zcash legacy bridge shares, so it has a single home.
 */
export function createLocalBitcoinApi(currencyId: string): CoinModuleApi<any> & BridgeApi {
  const { explorerEndpoint, explorerId } = walletBtcCurrencyById(
    currencyId,
    getCurrencyConfiguration<BitcoinCoinConfig>(currencyId),
  );
  return createBitcoinApi(
    { explorerEndpoint, explorerId },
    currencyId,
  ) as unknown as CoinModuleApi<any> & BridgeApi;
}
