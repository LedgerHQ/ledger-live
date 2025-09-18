import type { StellarOperation } from "../types/bridge";
import { fetchOperations } from "../network";
import { Operation } from "@ledgerhq/coin-framework/api/types";

export type ListOperationsOptions = {
  limit?: number;
  cursor?: string;
  order: "asc" | "desc";
  minHeight: number;
};

export async function listOperations(
  address: string,
  { limit, cursor, order, minHeight }: ListOperationsOptions,
): Promise<[Operation[], string]> {
  // Fake accountId
  const accountId = "";
  const [operations, nextCursor] = await fetchOperations({
    accountId,
    addr: address,
    minHeight,
    order: order,
    limit,
    cursor: cursor,
  });

  return [operations.map(op => convertToCoreOperation(op)), nextCursor];
}

const convertToCoreOperation = (operation: StellarOperation): Operation => {
  return {
    id: `${operation.hash}-${operation.extra.index}`,
    asset:
      operation.extra?.assetCode && operation.extra?.assetIssuer
        ? {
            type: "token",
            assetReference: operation.extra.assetCode,
            assetOwner: operation.extra.assetIssuer,
          }
        : { type: "native" },
    tx: {
      hash: operation.hash,
      block: {
        hash: operation.blockHash!,
        time: operation.extra.blockTime,
        height: operation.blockHeight!,
      },
      fees: BigInt(operation.fee.toString()),
      date: operation.date,
    },
    details: {
      sequence: operation.transactionSequenceNumber,
      ledgerOpType: operation.extra.ledgerOpType,
      assetAmount: operation.extra.assetAmount
        ? operation.extra.assetAmount
        : operation.value.toString(),
      memo: operation.extra.memo,
      status: operation.hasFailed ? "failed" : "success",
    },
    type: operation.type,
    value: BigInt(operation.value.toString()),
    senders: operation.senders,
    recipients: operation.recipients,
  };
};
