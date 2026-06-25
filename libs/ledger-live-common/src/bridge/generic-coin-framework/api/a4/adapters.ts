import type {
  AssetInfo,
  Balance,
  Operation,
} from "@ledgerhq/coin-module-framework/api/types";
import type { A4Balances, A4Operation } from "./client";

/**
 * Parse an A4 asset identifier into the framework `AssetInfo` model.
 *
 * A4 asset ids are strings: `native`, or `<standard>.<reference>` (e.g.
 * `erc20.0xdAC17F958D2ee523a2206206994597C13D831ec7`). The owner is the queried account address.
 */
export function parseA4Asset(assetId: string, owner: string): AssetInfo {
  if (assetId === "native") return { type: "native" };
  const dot = assetId.indexOf(".");
  if (dot === -1) {
    // Unknown shape: treat the whole id as the asset type with no reference.
    return { type: assetId };
  }
  return {
    type: assetId.slice(0, dot),
    assetReference: assetId.slice(dot + 1),
    assetOwner: owner,
  };
}

/** Map A4 `assets` map into the framework `Balance[]` model. */
export function adaptBalances(
  balances: A4Balances,
  address: string,
): Balance[] {
  return Object.entries(balances.assets ?? {}).map(([assetId, { value }]) => ({
    value: BigInt(value),
    asset: parseA4Asset(assetId, address),
  }));
}

/**
 * Map an A4 operation `type` to a Ledger Live `OperationType`.
 *
 * A4 emits lowercase coarse types (`send`/`receive`/…). When A4 already returns an LL-style
 * uppercase type we pass it through. Anything unrecognised becomes `NONE` so it is still
 * surfaced (as a neutral parent op) rather than dropped.
 */
function mapOperationType(a4Type: string): string {
  if (a4Type === a4Type.toUpperCase()) return a4Type; // already LL-style (OUT/IN/FEES/…)
  switch (a4Type) {
    case "send":
      return "OUT";
    case "receive":
      return "IN";
    case "fees":
      return "FEES";
    default:
      return "NONE";
  }
}

/**
 * Adapt one A4 operation to a framework `Operation`. Downstream,
 * `adaptCoreOperationToLiveOperation` turns this into a `LiveOperation` and
 * `getAccountShape` expands native/token operations into parent + sub operations.
 */
export function adaptOperation(a4Op: A4Operation, address: string): Operation {
  const type = mapOperationType(a4Op.type);
  const failed = a4Op.failed === true;

  const details: Record<string, unknown> = { ledgerOpType: type };
  if (a4Op.internal === true) details.internal = true;

  return {
    id: a4Op.txId,
    type,
    senders: a4Op.senders ?? [],
    recipients: a4Op.recipients ?? [],
    value: BigInt(a4Op.amount),
    asset: parseA4Asset(a4Op.asset, address),
    details,
    tx: {
      hash: a4Op.txId,
      block: {
        hash: a4Op.block.hash,
        height: a4Op.block.height,
        time: new Date(a4Op.block.time),
      },
      fees: BigInt(a4Op.fees ?? "0"),
      ...(a4Op.feesPayer ? { feesPayer: a4Op.feesPayer } : {}),
      date: new Date(a4Op.block.time),
      failed,
    },
  };
}

export function adaptOperations(
  a4Ops: A4Operation[],
  address: string,
): Operation[] {
  return a4Ops.map((op) => adaptOperation(op, address));
}
