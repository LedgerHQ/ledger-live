import network from "../network";
import { PolkadotOperation } from "../types";

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

export async function listOperations(addr: string, startAt?: number): Promise<Operation[]> {
  //The accountId is used to map Operations to Live types.
  const fakeAccountId = "";
  const operations = await network.getOperations(fakeAccountId, addr, startAt);

  return operations.map(convertToCoreOperation(addr));
}

const convertToCoreOperation = (address: string) => (operation: PolkadotOperation) => {
  const {
    hash,
    type,
    value,
    fee,
    blockHeight,
    senders,
    recipients,
    date,
    transactionSequenceNumber,
  } = operation;
  return {
    hash,
    address,
    type,
    value: BigInt(value.toString()),
    fee: BigInt(fee.toString()),
    blockHeight: blockHeight ?? 0,
    senders,
    recipients,
    date,
    transactionSequenceNumber: transactionSequenceNumber ?? 0,
  };
};
