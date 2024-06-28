import { getServerInfos, getTransactions } from "../network";
import type { XrplOperation } from "../network/types";
import { RIPPLE_EPOCH } from "./utils";

export type Operation = {
  hash: string;
  address: string;
  type: string;
  value: bigint;
  fee: bigint;
  blockHeight: number;
  senders: string[];
  recipients: string[];
  date: Date;
  transactionSequenceNumber: number;
};

/**
 * Returns list of operations associated to an account.
 * @param address Account address
 * @param blockHeight Height to start searching for operations
 * @returns
 */
export async function listOperations(address: string, blockHeight: number): Promise<Operation[]> {
  const serverInfo = await getServerInfos();
  const ledgers = serverInfo.info.complete_ledgers.split("-");
  const minLedgerVersion = Number(ledgers[0]);
  const maxLedgerVersion = Number(ledgers[1]);

  // if there is no ops, it might be after a clear and we prefer to pull from the oldest possible history
  const startAt = Math.max(blockHeight, minLedgerVersion);

  const transactions = await getTransactions(address, {
    ledger_index_min: startAt,
    ledger_index_max: maxLedgerVersion,
  });

  return transactions.map(convertToCoreOperation(address));
}

const convertToCoreOperation = (address: string) => (operation: XrplOperation) => {
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

  const toEpochDate = (RIPPLE_EPOCH + date) * 1000;

  return {
    hash,
    address,
    type,
    value,
    fee: feeValue,
    blockHeight: inLedger,
    senders: [Account],
    recipients: [Destination],
    date: new Date(toEpochDate),
    transactionSequenceNumber: Sequence,
  };
};
