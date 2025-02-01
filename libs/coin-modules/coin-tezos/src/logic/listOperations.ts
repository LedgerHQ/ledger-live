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
  block: {
    hash?: string;
    height: number;
    time?: Date;
  };
  senders: string[];
  recipients: string[];
  date: Date;
  transactionSequenceNumber: number;
};

export async function listOperations(
  address: string,
  { token, limit }: { limit?: number; token?: string },
): Promise<[Operation[], string]> {
  let options: { lastId?: number; limit?: number } = { limit: limit };
  if (token) {
    options = { ...options, lastId: JSON.parse(token) };
  }
  const operations = await tzkt.getAccountOperations(address, options);
  const lastOperation = operations.slice(-1)[0];
  const nextId = lastOperation ? JSON.stringify(lastOperation?.id) : "";
  return [
    operations
      .filter(op => isAPITransactionType(op) || isAPIDelegationType(op))
      .reduce((acc, op) => acc.concat(convertOperation(address, op)), [] as Operation[]),
    nextId,
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
    block: {
      hash: operation.block,
      height: operation.level,
      time: new Date(operation.timestamp),
    },
    senders: [sender?.address ?? ""],
    recipients: [targetAddress],
    date: new Date(timestamp),
    transactionSequenceNumber: counter,
  };
}
