import type { StellarOperation } from "../types/bridge";
import { fetchOperations } from "../network";
import { Operation } from "@ledgerhq/coin-framework/api/types";
import { StellarAsset } from "../types";

export type ListOperationsOptions = {
  limit?: number;
  cursor?: string;
  order: "asc" | "desc";
  minHeight: number;
};

export async function listOperations(
  address: string,
  { limit, cursor, order, minHeight }: ListOperationsOptions,
): Promise<[Operation<StellarAsset>[], string]> {
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

const convertToCoreOperation = (operation: StellarOperation): Operation<StellarAsset> => {
  return {
    id: `${operation.hash}-${operation.extra.index}`,
    asset: { type: "native" },
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
    type: operation.type,
    value: BigInt(operation.value.toString()),
    senders: operation.senders,
    recipients: operation.recipients,
  };
};
