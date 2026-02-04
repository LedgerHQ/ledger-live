import { ListOperationsOptions, Operation } from "@ledgerhq/coin-framework/api/types";
import { fetchOperations } from "../network";
import type { StellarOperation } from "../types/bridge";

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
    order: order || "desc",
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
      failed: operation.hasFailed ?? false,
    },
    details: {
      sequence: operation.transactionSequenceNumber?.toString(),
      ledgerOpType: operation.extra.ledgerOpType,
      assetAmount: operation.extra.assetAmount
        ? operation.extra.assetAmount
        : operation.value.toString(),
      memo: operation.extra.memo,
    },
    type: operation.type,
    value: BigInt(operation.value.toString()),
    senders: operation.senders,
    recipients: operation.recipients,
  };
};
