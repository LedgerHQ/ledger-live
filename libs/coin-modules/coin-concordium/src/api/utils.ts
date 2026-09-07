import type { AssetInfo, Operation } from "@ledgerhq/coin-module-framework/api/index";
import type { RawOperation } from "../types";

/**
 * All three fields match what `getBalance` reports for the same token, because
 * the two are paired on them: a consumer matching an operation to a balance
 * reads `assetReference` and `assetOwner` together. No unit is published — the
 * CAL owns a token's name and ticker, and this surface resolves no CAL.
 */
function toAssetInfo(op: RawOperation, address: string): AssetInfo {
  if (op.tokenId === undefined) {
    return { type: "native" };
  }

  return { type: "plt", assetReference: op.tokenId, assetOwner: address };
}

export function mapRawOperationToApiOperation(op: RawOperation, address: string): Operation {
  const date = op.date;

  const details: Record<string, unknown> = {
    pagingToken: String(op.id),
    ...(op.memo ? { memo: op.memo } : {}),
  };

  return {
    id: op.hash,
    asset: toAssetInfo(op, address),
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
