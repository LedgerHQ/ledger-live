import { tzkt } from "../network";
import {
  APIBlock,
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
  block?: {
    hash: string;
    height: number;
    time: Date;
  };
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
  const operationswithBlock = await Promise.all(
    operations
      .filter(op => isAPITransactionType(op) || isAPIDelegationType(op))
      .map(async op => {
        const block = await tzkt.getBlockByHash(op.block);
        return convertOperation(address, op, block);
      }),
  );
  return [operationswithBlock, operations.slice(-1)[0].id];
}

function convertOperation(
  address: string,
  operation: APITransactionType | APIDelegationType,
  block: APIBlock,
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
    blockHeight: block.level,
    block: {
      hash: block.hash,
      height: block.level,
      time: new Date(block.timestamp),
    },
    senders: [sender?.address ?? ""],
    recipients: [targetAddress],
    date: new Date(timestamp),
    transactionSequenceNumber: counter,
  };
}
