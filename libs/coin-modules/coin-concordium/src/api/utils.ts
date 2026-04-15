import type { Operation } from "@ledgerhq/coin-module-framework/api/index";
import type { RawOperation } from "../types";

export function mapRawOperationToApiOperation(op: RawOperation): Operation {
  const date = op.date;

  const details: Record<string, unknown> = {
    pagingToken: String(op.id),
    ...(op.memo ? { memo: op.memo } : {}),
  };

  return {
    id: op.hash,
    asset: { type: "native" },
    tx: {
      hash: op.hash,
      fees: BigInt(op.fee),
      date,
      failed: op.failed,
      block: {
        height: op.blockHeight,
        hash: op.blockHash || "",
        time: date,
      },
    },
    type: op.type,
    value: BigInt(op.value),
    senders: [op.sender],
    recipients: [op.recipient],
    details,
  };
}
