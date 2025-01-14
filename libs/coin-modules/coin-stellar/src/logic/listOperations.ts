import type { StellarOperation } from "../types/bridge";
import { fetchOperations } from "../network";

export type Operation = {
  hash: string;
  address: string;
  type: string;
  value: bigint;
  fee: bigint;
  block: {
    hash?: string;
    time?: Date;
    height: number;
  };
  senders: string[];
  recipients: string[];
  date: Date;
  transactionSequenceNumber: number;
};

export async function listOperations(
  address: string,
  { limit, cursor }: { limit: number; cursor?: number | undefined },
): Promise<[Operation[], number]> {
  // Fake accountId
  const accountId = "";
  const [operations, nextCursor] = await fetchOperations({
    accountId,
    addr: address,
    order: "desc",
    limit,
    cursor: cursor?.toString(),
  });

  return [operations.map(convertToCoreOperation(address)), nextCursor];
}

const convertToCoreOperation = (address: string) => (operation: StellarOperation) => {
  return {
    hash: operation.hash,
    address,
    type: operation.type,
    value: BigInt(operation.value.toString()),
    fee: BigInt(operation.fee.toString()),
    block: {
      hash: operation.blockHash!,
      time: operation.extra.blockTime,
      height: operation.blockHeight!,
    },
    senders: operation.senders,
    recipients: operation.recipients,
    date: operation.date,
    transactionSequenceNumber: operation.transactionSequenceNumber ?? 0,
  };
};
