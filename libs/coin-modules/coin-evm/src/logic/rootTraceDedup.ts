import type { BlockOperation } from "@ledgerhq/coin-module-framework/api/index";

/**
 * Drops any internal op that is structurally identical to one of the coin tx's native ops,
 * using `(address, peer, amount)` as the match key.
 *
 * Why excluding `asset` from the key is safe: this helper only ever considers `transfer` ops
 * whose `asset.type === "native"` (the filter below). ERC20/721/1155 ops come from receipt
 * logs — a different, non-overlapping source — so they are passed through unchanged.
 *
 * Why the structural dedup cannot over-drop: in an EVM trace, every nested call frame has
 * `from = <currently-executing contract>`, so a nested native transfer cannot satisfy both
 * `address == tx.originator` and `amount == tx.value` unless it is literally the root-trace
 * duplicate of the coin tx itself. The only EVM opcodes that would violate this invariant
 * (`delegatecall` / `staticcall` / `callcode`, which preserve the caller's `from`) are
 * filtered semantically upstream in the adapters, so they never reach this point.
 *
 * Intentionally not re-exported from `logic/index.ts` — implementation detail of `getBlock`
 * (and its tests).
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

function signatureOf(op: BlockOperation & { type: "transfer" }): string {
  const addr = (op.address ?? "").toLowerCase();
  const peer = ("peer" in op && op.peer ? op.peer : "").toLowerCase();
  const amount = op.amount?.toString() ?? "";
  return `${addr}\t${peer}\t${amount}`;
}
