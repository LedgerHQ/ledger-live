import type { CryptoCurrency } from "@ledgerhq/ledger-wallet-framework/types";
import { blockchainBaseURL as walletBtcBaseURL } from "@ledgerhq/wallet-btc/explorer/baseUrl";
import { toWalletBtcCurrency } from "./walletBtcCurrency";

/**
 * CryptoCurrency-friendly adapter over wallet-btc's blockchainBaseURL.
 *
 * Kept here so existing consumers (e.g. ledger-live-common) can keep importing
 * `@ledgerhq/coin-bitcoin/explorer` with a CryptoCurrency, while wallet-btc stays
 * dependency-inverted (it only knows the injected WalletBtcCurrency).
 */
export const blockchainBaseURL = (currency: CryptoCurrency): string =>
  walletBtcBaseURL(toWalletBtcCurrency(currency));
