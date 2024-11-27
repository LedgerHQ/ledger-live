import type { Operation } from "@ledgerhq/coin-framework/api/index";
import { getTransactions } from "../network/trongridNew";
import { TrongridTxInfo } from "../types";

/**
 * Returns list of operations associated to an account.
 * @param address Account address
 * @param blockHeight Height to start searching for operations
 * @returns
 */
export async function listOperations(address: string, blockHeight: number): Promise<Operation[]> {
  const transactions = await getTransactions(address, blockHeight);

  return transactions.map(convertToCoreOperation(address));
}

const convertToCoreOperation = (address: string) => (tx: TrongridTxInfo) => {
  return {
    hash: tx.txID,
    address,
    type: tx.type,
    value: BigInt(tx.value?.toString() || 0),
    fee: BigInt(tx.fee?.toString() || 0),
    blockHeight: tx.blockHeight || 0,
    senders: [tx.from],
    recipients: tx.to ? [tx.to] : [],
    date: tx.date,
    transactionSequenceNumber: 0,
  } satisfies Operation;
}
