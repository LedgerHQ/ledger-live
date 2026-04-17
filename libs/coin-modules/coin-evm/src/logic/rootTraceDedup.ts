import type { BlockOperation } from "@ledgerhq/coin-module-framework/api/index";

/**
 * Drops any internal op that is structurally identical to one of the coin tx's native ops.
 * Only native-asset ops are considered: ERC20/721/1155 ops are surfaced by receipt logs,
 * which are a different (non-overlapping) source.
 *
 * Intentionally not re-exported from `logic/index.ts` — this helper is an
 * implementation detail of `getBlock` (and its tests).
 */
export function dropRootTraceDuplicates(
  coinOps: readonly BlockOperation[],
  internalOps: readonly BlockOperation[],
): BlockOperation[] {
  const coinNativeSignatures = new Set<string>();
  for (const op of coinOps) {
    if (op.type !== "transfer" || op.asset.type !== "native") continue;
    coinNativeSignatures.add(signatureOf(op));
  }
  if (coinNativeSignatures.size === 0) return [...internalOps];
  return internalOps.filter(op => {
    if (op.type !== "transfer" || op.asset.type !== "native") return true;
    return !coinNativeSignatures.has(signatureOf(op));
  });
}

function signatureOf(op: BlockOperation): string {
  if (op.type !== "transfer") return "";
  const addr = (op.address ?? "").toLowerCase();
  const peer = ("peer" in op && op.peer ? op.peer : "").toLowerCase();
  const amount = op.amount?.toString() ?? "";
  return `${addr}\t${peer}\t${amount}`;
}
