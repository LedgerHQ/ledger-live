import type { Operation } from "@ledgerhq/coin-framework/api/index";
import { getTransactions } from "../../network/indexer";

/**
 * Returns list of operations associated to an account.
 * @param address Account address
 * @param blockHeight Height to start searching for operations
 * @returns
 */
export async function listOperations(address: string, blockHeight: number): Promise<Operation[]> {
  const transactions = await getTransactions(address, {
    from: blockHeight,
    size: 100,
  });

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
    blockHeight: inLedger,
    senders: [Account],
    recipients: [Destination],
    date: new Date(date),
    transactionSequenceNumber: Sequence,
  };
};
