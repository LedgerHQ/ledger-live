import type { WalletBtcCurrency } from "../crypto/types";

const EXPLORER_VERSION = "v4";

/**
 * Build the Ledger explorer base URL for a currency.
 *
 * The explorer id and endpoint are provided by the consumer through
 * `WalletBtcCurrency` (dependency inversion): wallet-btc no longer reads the
 * Ledger currency registry or the env (@ledgerhq/live-env).
 * The caller resolves the endpoint (e.g. from the EXPLORER / EXPLORER_REGTEST env)
 * and the explorer id, and passes them in.
 */
export const blockchainBaseURL = (currency: WalletBtcCurrency): string => {
  const explorerId = currency.explorerId ?? currency.id;
  return `${currency.explorerEndpoint}/blockchain/${EXPLORER_VERSION}/${explorerId}`;
};
