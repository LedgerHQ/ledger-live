import type {
  BlockOperation,
  TransferBlockOperation,
} from "@ledgerhq/coin-module-framework/api/index";

/**
 * Drops any internal op that is structurally identical to one of the coin tx's native ops,
 * using `(address, peer, amount)` as the match key.
 *
 * Why excluding `asset` from the key is safe: only `transfer` ops whose `asset.type === "native"`
 * are considered — ERC20/721/1155 ops come from receipt logs, a non-overlapping source.
 *
 * Why the structural dedup cannot over-drop: in an EVM trace, every nested call frame has
 * `from = <currently-executing contract>`, so a nested native transfer cannot satisfy both
 * `address == tx.originator` and `amount == tx.value` unless it is literally the root-trace
 * duplicate of the coin tx itself. The only EVM opcodes that would violate this invariant
 * (`delegatecall` / `staticcall` / `callcode`, which preserve the caller's `from`) are
 * filtered semantically upstream in the adapters, so they never reach this point.
 *
 * Intentionally not re-exported from `logic/index.ts` — implementation detail of `getBlock`.
 */
export function dropRootTraceDuplicates(
  coinOps: readonly BlockOperation[],
  internalOps: readonly BlockOperation[],
): BlockOperation[] {
  const coinNativeSignatures = new Set<string>();
  for (const op of coinOps) {
    if (isNativeTransfer(op)) coinNativeSignatures.add(signatureOf(op));
  }
  if (coinNativeSignatures.size === 0) return [...internalOps];
  return internalOps.filter(
    op => !isNativeTransfer(op) || !coinNativeSignatures.has(signatureOf(op)),
  );
}

function isNativeTransfer(
  op: BlockOperation,
): op is TransferBlockOperation & { asset: { type: "native" } } {
  return op.type === "transfer" && op.asset.type === "native";
}

function signatureOf(op: TransferBlockOperation): string {
  const peer = op.peer?.toLowerCase() ?? "";
  return `${op.address.toLowerCase()}\t${peer}\t${op.amount.toString()}`;
}
