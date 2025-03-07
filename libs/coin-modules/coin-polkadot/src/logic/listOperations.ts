import network from "../network";
import { PolkadotOperation } from "../types";

export type Operation = {
  hash: string;
  address: string;
  type: string;
  value: bigint;
  fee: bigint;
  block: {
    height: number;
    hash?: string;
    time?: Date;
  };
  senders: string[];
  recipients: string[];
  date: Date;
  transactionSequenceNumber: number;
};

export async function listOperations(
  addr: string,
  { limit, startAt }: { limit: number; startAt?: number | undefined },
): Promise<[Operation[], number]> {
  //The accountId is used to map Operations to Live types.
  const fakeAccountId = "";
  const operations = await network.getOperations(fakeAccountId, addr, startAt, limit);

  return [operations.map(convertToCoreOperation(addr)), operations.slice(-1)[0].blockHeight ?? 0];
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
    tx: {
      hash,
      fees: BigInt(fee.toString()),
      block: {
        height: blockHeight ?? 0,
        time: date,
      },
    },
    type,
    value: BigInt(value.toString()),
    senders,
    recipients,
    transactionSequenceNumber: transactionSequenceNumber ?? 0,
  };
};
