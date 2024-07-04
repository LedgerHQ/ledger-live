import { APIOperation, fetchAllTransactions } from "../network";

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

export async function listOperations(address: string, _blockHeight: number): Promise<Operation[]> {
  const operations = await fetchAllTransactions(address);
  return operations.reduce(
    (acc, op) => acc.concat(convertOperation(address, op) ?? acc),
    [] as Operation[],
  );
}

function convertOperation(address: string, operation: APIOperation): Operation | null {
  if (operation.type !== "transaction") {
    return null;
  }

  const { amount, hash, storageFee, sender, target, timestamp, type, counter } = operation;
  return {
    hash: hash ?? "",
    address,
    type: type,
    value: BigInt(amount),
    // storageFee for transaction is always present
    fee: BigInt(storageFee!),
    blockHeight: 0, // operation.block is a string
    senders: [sender?.address ?? ""],
    recipients: [target?.address ?? ""],
    date: new Date(timestamp),
    transactionSequenceNumber: counter,
  };
}
