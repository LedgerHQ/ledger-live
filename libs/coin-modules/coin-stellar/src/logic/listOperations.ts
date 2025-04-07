import type { StellarOperation } from "../types/bridge";
import { fetchOperations } from "../network";
import { Operation } from "@ledgerhq/coin-framework/api/types";
import { StellarAsset } from "../types";

export type ListOperationsOptions = {
  limit?: number;
  cursor?: string;
  order: "asc" | "desc";
};

export async function listOperations(
  address: string,
  { limit, cursor, order }: ListOperationsOptions,
): Promise<[Operation<StellarAsset>[], string]> {
  // Fake accountId
  const accountId = "";
  const [operations, nextCursor] = await fetchOperations({
    accountId,
    addr: address,
    order: order,
    limit,
    cursor: cursor,
  });

  return [operations.map(op => convertToCoreOperation(op)), nextCursor];
}

const convertToCoreOperation = (operation: StellarOperation): Operation<StellarAsset> => {
  return {
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
    operationIndex: 0,
    type: operation.type,
    value: BigInt(operation.value.toString()),
    senders: operation.senders,
    recipients: operation.recipients,
  };
};
