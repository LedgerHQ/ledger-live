import { ListOperationsOptions, Operation, Page } from "@ledgerhq/coin-module-framework/api/types";
import { fetchOperations } from "../network";

export async function listOperations(
  address: string,
  { limit, cursor, order, minHeight }: ListOperationsOptions,
): Promise<Page<Operation>> {
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

  const mappedOperations = operations.map(op => convertToLegacyOperation(op));

  return { items: mappedOperations, next: nextCursor };
}

function convertToLegacyOperation(operation: Operation): Operation {
  const details = operation.details;

  return {
    id: `${operation.tx.hash}-${details?.index ?? ""}`,
    asset: operation.asset,
    tx: operation.tx,
    details: {
      sequence: details?.sequence,
      ledgerOpType: details?.ledgerOpType,
      assetAmount: details?.assetAmount ?? operation.value.toString(),
      memo: details?.memo,
    },
    type: operation.type,
    value: operation.value,
    senders: operation.senders,
    recipients: operation.recipients,
  };
}
