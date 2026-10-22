import type { AssetInfo, Operation } from "@ledgerhq/coin-module-framework/api/index";
import type { RawOperation } from "../types";

/**
 * Matches what `getBalance` reports for the same token: a consumer pairing an
 * operation with a balance reads `assetReference` and `assetOwner` together. No
 * unit is published, since the CAL owns a token's name and ticker.
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
      // The fee this account paid, unlike `getBlock`, which reports the full cost.
      // The proxy omits `cost` on a row another account paid for, so an IN row
      // reports 0 and `feesPayer` names the account that was charged.
      fees: BigInt(op.fee),
      ...(op.feesPayer ? { feesPayer: op.feesPayer } : {}),
      date,
      failed: op.failed,
      block: {
        height: op.blockHeight,
        hash: op.blockHash || "",
        time: date,
      },
    },
    type: op.type,
    // Net of fees, unlike `op.value`: the fee is already on `tx.fees`, and the
    // generic adapter adds it back for a native OUT.
    value: BigInt(op.amount),
    // A fee-only or rejected operation names no counterparty, and `[""]` would
    // publish an address the chain never saw.
    senders: op.sender ? [op.sender] : [],
    recipients: op.recipient ? [op.recipient] : [],
    details,
  };
}
