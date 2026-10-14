import type { BitcoinAccount } from "@ledgerhq/coin-bitcoin/types";
import wallet from "@ledgerhq/wallet-btc/index";
import type { AccountLike } from "@ledgerhq/types-live";
import { getBoundWalletAccount } from "../coinConfig";

/**
 * Best-effort local check for BTC transaction confirmation.
 *
 * Returns true **only if** the transaction is known to be confirmed
 * in the locally-synced account data.
 *
 * Returns false if:
 * - the transaction is unconfirmed
 * - the transaction is not found locally
 * - the account data could not be retrieved
 *
 * This function does NOT guarantee on-chain confirmation.
 */
export async function isTransactionConfirmed({
  account,
  hash,
}: {
  account: AccountLike;
  hash: string;
}): Promise<boolean> {
  try {
    if (
      account.type !== "Account" ||
      !(account as BitcoinAccount).bitcoinResources?.walletAccount
    ) {
      return false;
    }
    // A deserialized account has no explorer until bound from the coin config.
    const { walletAccount } = getBoundWalletAccount(account);
    const blockHeight = await wallet.getAccountTxBlockHeight(walletAccount, hash);
    return Boolean(blockHeight && blockHeight > 0);
  } catch {
    // best-effort local check: treat any retrieval failure as "not confirmed"
    return false;
  }
}
