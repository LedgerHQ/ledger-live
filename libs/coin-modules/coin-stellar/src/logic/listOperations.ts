import type { Operation as LiveOperation } from "@ledgerhq/types-live";
import { fetchOperations } from "../network";

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
  // Fake accountId
  const accountId = "";
  const operations = await fetchOperations({
    accountId,
    addr: address,
    order: "asc",
    cursor: "0",
  });
  return operations.map(convertToCoreOperation(address));
}

const convertToCoreOperation = (address: string) => (operation: LiveOperation) => {
  return {
    hash: operation.hash,
    address,
    type: operation.type,
    value: BigInt(operation.value.toString()),
    fee: BigInt(operation.fee.toString()),
    blockHeight: operation.blockHeight!,
    senders: operation.senders,
    recipients: operation.recipients,
    date: operation.date,
    transactionSequenceNumber: operation.transactionSequenceNumber ?? 0,
  };
};
