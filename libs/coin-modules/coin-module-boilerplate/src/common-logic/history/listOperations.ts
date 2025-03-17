import type { Operation, Pagination } from "@ledgerhq/coin-framework/api/index";
import { getTransactions } from "../../network/indexer";
import { BoilerplateToken } from "../../types";

/**
 * Returns list of operations associated to an account.
 * @param address Account address
 * @param pagination Pagination options
 * @returns Operations found and the next "id" or "index" to use for pagination (i.e. `start` property).\
 * If `0` is returns, no pagination needed.
 * This "id" or "index" value, thus it has functional meaning, is different for each blockchain.
 */
export async function listOperations(
  address: string,
  page: Pagination,
): Promise<[Operation<BoilerplateToken>[], string]> {
  const transactions = await getTransactions(address, { from: page.minHeight });
  return [transactions.map(convertToCoreOperation(address)), ""];
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
    tx: {
      hash,
      fees: feeValue,
      date: new Date(date),
      block: {
        height: inLedger,
        hash,
        time: date,
      },
    },
    type,
    value,
    senders: [Account],
    recipients: [Destination],
    transactionSequenceNumber: Sequence,
    operationIndex: 0,
  };
};
