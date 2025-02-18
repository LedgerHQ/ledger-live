import { tzkt } from "../network";
import { log } from "@ledgerhq/logs";
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
  const nextToken = lastOperation ? JSON.stringify(lastOperation?.id) : "";
  return [
    operations
      .filter(op => isAPITransactionType(op) || isAPIDelegationType(op))
      .reduce((acc, op) => acc.concat(convertOperation(address, op)), [] as Operation[]),
    nextToken,
  ];
}

// note that "initiator" of APITransactionType is never used in the conversion
function convertOperation(
  address: string,
  operation: APITransactionType | APIDelegationType,
): Operation {
  const { amount, hash, storageFee, sender, timestamp, type, counter } = operation;

  let targetAddress = undefined;
  if (isAPITransactionType(operation)) {
    targetAddress = operation?.target?.address;
  } else if (isAPIDelegationType(operation)) {
    // delegate and undelegate has the type, but hold the address in different fields
    targetAddress = operation?.newDelegate?.address || operation?.prevDelegate?.address;
  }

  const recipients = [];
  if (!targetAddress) {
    log("coin:tezos", "(logic/operations): No target address found for operation", operation);
  } else {
    recipients.push(targetAddress);
  }

  const senders = sender?.address ? [sender.address] : [];

  return {
    // hash id defined nullable in the tzkt API, but I wonder when it would be null ?
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
    senders: senders,
    recipients: recipients,
    date: new Date(timestamp),
    transactionSequenceNumber: counter,
  };
}
