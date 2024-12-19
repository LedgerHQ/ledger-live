import { tzkt } from "../network";
import {
  type APIDelegationType,
  type APITransactionType,
  isAPIDelegationType,
  isAPITransactionType,
} from "../network/types";

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

export async function listOperations(
  address: string,
  { lastId, limit }: { lastId?: number; limit?: number },
): Promise<[Operation[], number]> {
  const operations = await tzkt.getAccountOperations(address, { lastId, limit });
  return [
    operations
      .filter(op => isAPITransactionType(op) || isAPIDelegationType(op))
      .reduce((acc, op) => acc.concat(convertOperation(address, op)), [] as Operation[]),
    operations.slice(-1)[0].id,
  ];
}

function convertOperation(
  address: string,
  operation: APITransactionType | APIDelegationType,
): Operation {
  const { amount, hash, storageFee, sender, timestamp, type, counter } = operation;
  let targetAddress = "";
  if (isAPITransactionType(operation) && operation.target) {
    targetAddress = operation.target.address;
  }
  return {
    hash: hash ?? "",
    address,
    type: type,
    value: BigInt(amount),
    // storageFee for transaction is always present
    fee: BigInt(storageFee ?? 0),
    blockHeight: 0, // operation.block is a string
    senders: [sender?.address ?? ""],
    recipients: [targetAddress],
    date: new Date(timestamp),
    transactionSequenceNumber: counter,
  };
}
