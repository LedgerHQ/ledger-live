import type { Operation, Pagination } from "@ledgerhq/coin-framework/api/index";
import { getTransactions } from "../../network/indexer";
import { BoilerplateOperation } from "../../network/types";

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
): Promise<[Operation[], string]> {
  const transactions = await getTransactions(address, { from: page.minHeight });
  return [transactions.map(convertToCoreOperation(address)), ""];
}

const convertToCoreOperation =
  (address: string) =>
  (operation: BoilerplateOperation): Operation => {
    const {
      meta: { delivered_amount },
      tx: { Fee, hash, inLedger, date, Account, Destination },
    } = operation;

    const type = Account === address ? "OUT" : "IN";
    let value =
      delivered_amount && typeof delivered_amount === "string"
        ? BigInt(delivered_amount)
        : BigInt(0);

    const feeValue = BigInt(Fee);
    if (type === "OUT") {
      if (!Number.isNaN(feeValue)) {
        value = value + feeValue;
      }
    }

    return {
      /**
       * Note: The operation ID must be concatenated with another
       * value if the transaction hash is not enough to identify it
       */
      id: hash,
      asset: { type: "native" },
      tx: {
        hash,
        fees: feeValue,
        date: new Date(date),
        failed: false,
        block: {
          height: inLedger,
          hash,
          time: new Date(date),
        },
      },
      type,
      value,
      senders: [Account],
      recipients: [Destination],
    };
  };
