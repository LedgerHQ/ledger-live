import { fetchTransactions } from "./fetchTransactions";
import { getHeight } from "./getHeight";
import { getBalance } from "./getBalance";

export async function getAccountInfo(address: string, startAt: string) {
  const [balance, transactions, blockHeight] = await Promise.all([
    getBalance(address),
    fetchTransactions(address, startAt),
    getHeight(),
  ]);

  return {
    balance,
    transactions,
    blockHeight,
  };
}
