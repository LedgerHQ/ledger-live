import type { Operation, Pagination } from "@ledgerhq/coin-framework/api/index";
import { getTransactions } from "../../network/indexer";

/**
 * Returns list of operations associated to an account.
 * @param address Account address
 * @param pagination Pagination options
 * @returns
 */
export async function listOperations(
  address: string,
  { limit, start }: Pagination,
): Promise<Operation[]> {
  const transactions = await getTransactions(address, { from: start || 0, size: limit });

  return transactions.map(convertToCoreOperation(address));
}

const convertToCoreOperation = (address: string) => (operation: any) => {
  const {
    meta: { delivered_amount },
    tx: { Fee, hash, inLedger, date, Account, Destination, Sequence },
  } = operation;

  const type = Account === address ? "OUT" : "IN";
  let value =
    delivered_amount && typeof delivered_amount === "string" ? BigInt(delivered_amount) : BigInt(0);

  const feeValue = BigInt(Fee);
  if (type === "OUT") {
    if (!Number.isNaN(feeValue)) {
      value = value + feeValue;
    }
  }

  return {
    hash,
    address,
    type,
    value,
    fee: feeValue,
    block: {
      height: inLedger,
      hash,
      time: date,
    },
    senders: [Account],
    recipients: [Destination],
    date: new Date(date),
    transactionSequenceNumber: Sequence,
  };
};
