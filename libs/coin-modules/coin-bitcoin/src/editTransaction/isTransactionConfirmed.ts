import { Account } from "../wallet-btc";
import wallet from "../wallet-btc";

/**
 * Check if a BTC transaction is confirmed using txid.
 * If the tx is not found or has no blockHeight, it is unconfirmed.
 */
export async function isTransactionConfirmed(account: Account, txid: string): Promise<boolean> {
  try {
    const { txs: transactions } = await wallet.getAccountTransactions(account);

    const transaction = transactions.find(tx => tx.hash === txid);
    if (transaction && transaction.block?.height && transaction.block.height > 0) {
      return true; // confirmed
    }
    return false; // unconfirmed
  } catch (err: any) {
    // Not found → unconfirmed
    if (err.message.includes("not found")) {
      return false;
    }
    throw err;
  }
}
