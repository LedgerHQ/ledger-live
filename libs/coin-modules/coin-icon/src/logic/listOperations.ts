import type {
  ListOperationsOptions,
  Operation,
  Page,
} from "@ledgerhq/coin-module-framework/api/index";
import { InvalidParameterError } from "@ledgerhq/coin-module-framework/errors";
import type { CryptoCurrency } from "@ledgerhq/ledger-wallet-framework/types";
import BigNumber from "bignumber.js";
import { getTxHistory } from "../network/indexer";
import type { IconTransactionType } from "../network/types";
import { LIMIT } from "../constants";

const SUCCESS_STATUS = "0x1";

const toBigInt = (value: string): bigint => BigInt(new BigNumber(value).toFixed());

const toCoreOperation =
  (address: string) =>
  (transaction: IconTransactionType): Operation => {
    const date = new Date(transaction.block_timestamp / 1000);
    return {
      id: transaction.hash,
      type: transaction.from_address === address ? "OUT" : "IN",
      senders: [transaction.from_address],
      recipients: [transaction.to_address],
      value: transaction.value ? toBigInt(transaction.value) : 0n,
      asset: { type: "native" },
      details: { hasValue: Boolean(transaction.value) },
      tx: {
        hash: transaction.hash,
        block: { height: transaction.block_number, hash: "", time: date },
        fees: toBigInt(transaction.transaction_fee),
        date,
        failed: transaction.status !== SUCCESS_STATUS,
      },
    };
  };

export async function listOperations(
  currency: CryptoCurrency,
  address: string,
  options: ListOperationsOptions,
): Promise<Page<Operation>> {
  if (options.minHeight > 0) {
    throw new InvalidParameterError("icon: listOperations does not support minHeight");
  }
  if (options.order === "asc") {
    throw new InvalidParameterError("icon: listOperations does not support ascending order");
  }

  const limit = options.limit ?? LIMIT;
  const skip = options.cursor ? Number(options.cursor) : 0;
  const transactions = await getTxHistory(address, skip, currency, limit);

  return {
    items: transactions.map(toCoreOperation(address)),
    next: transactions.length < limit ? undefined : String(skip + limit),
  };
}
