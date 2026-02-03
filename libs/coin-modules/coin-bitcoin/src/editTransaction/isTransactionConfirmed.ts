import wallet, { Account } from "../wallet-btc";

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
export async function isTransactionConfirmed(account: Account, txId: string): Promise<boolean> {
  try {
    const { txs: transactions } = await wallet.getAccountTransactions(account);

    const transaction = transactions.find(tx => tx.hash === txId);
    return Boolean(transaction?.block?.height && transaction.block.height > 0);
  } catch {
    return false;
  }
}
