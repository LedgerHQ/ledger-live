import type { AssetChange, UpdateView } from "@domain/api-account-portfolio";
import {
  AccountOperationSchema,
  type AccountOperation,
  type OperationId,
  type OperationType,
} from "@domain/entity-account-operation";
import type { AccountDescriptor } from "@domain/entity-account-descriptor";

/** `unmapped`: token changes with no CAL id, left out. `unreadable`: updates that could not be read. */
export type MappedOperations = {
  rows: AccountOperation[];
  unmapped: number;
  unreadable: number;
};

const SIGNED_INTEGER = /^-?\d+$/;

const abs = (value: bigint) => (value < 0n ? -value : value);

function typeOf(change: bigint): OperationType {
  if (change > 0n) return "IN";
  if (change < 0n) return "OUT";
  return "NONE";
}

/** The block's height when it is a number or carries one; the service does not document it. */
function heightOf(block: unknown): number | undefined {
  if (typeof block === "number") return block;
  if (typeof block === "object" && block !== null && "height" in block) {
    return typeof block.height === "number" ? block.height : undefined;
  }
  return undefined;
}

/** `null` without a block; a block with no readable height still means confirmed, at height 0. */
const blockHeightOf = (block: unknown) => (block ? (heightOf(block) ?? 0) : null);

function isoDate(time: string) {
  const date = new Date(time);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

/** The net change per asset: the account's coin for `native`, the CAL id for a token. */
function changesOf(descriptor: AccountDescriptor, deltas: readonly AssetChange[]) {
  const changes = new Map<string, bigint>([[descriptor.network, 0n]]);
  let unmapped = 0;
  for (const delta of deltas) {
    const assetId = delta.asset === "native" ? descriptor.network : (delta.cal_id ?? undefined);
    if (assetId === undefined) {
      unmapped += 1;
      continue;
    }
    changes.set(assetId, (changes.get(assetId) ?? 0n) + BigInt(delta.amount));
  }
  return { changes, unmapped };
}

/** The native row, then one row per token changed, pointing at it. Undefined when unreadable. */
function rowsOf(descriptor: AccountDescriptor, update: UpdateView) {
  const deltas = update.deltas ?? [];
  if (![update.fee, ...deltas].every(change => SIGNED_INTEGER.test(change.amount))) {
    return undefined;
  }
  const { changes, unmapped } = changesOf(descriptor, deltas);
  const blockHeight = blockHeightOf(update.block);
  const date = isoDate(update.time);
  const rows: AccountOperation[] = [];
  let parentId: OperationId | undefined;
  for (const [assetId, change] of changes) {
    if (parentId !== undefined && change === 0n) continue;
    const type = typeOf(change);
    const parsed = AccountOperationSchema.safeParse({
      id: `${assetId}-${update.tx.hash}-${type}`,
      hash: update.tx.hash,
      type,
      assetId,
      value: abs(change).toString(),
      fee: parentId === undefined ? abs(BigInt(update.fee.amount)).toString() : "0",
      senders: [],
      recipients: [],
      blockHeight,
      date,
      hasFailed: update.failed,
      parentId,
    });
    if (!parsed.success) return undefined;
    rows.push(parsed.data);
    parentId ??= parsed.data.id;
  }
  return { rows, unmapped, pending: blockHeight === null };
}

/** Pending first, then in the service's newest-first order, each token row right after its parent. */
export function toAccountOperations(
  descriptor: AccountDescriptor,
  updates: readonly UpdateView[],
): MappedOperations {
  let unmapped = 0;
  let unreadable = 0;
  const groups: { rows: AccountOperation[]; pending: boolean }[] = [];
  for (const update of updates) {
    const mapped = rowsOf(descriptor, update);
    if (!mapped) {
      unreadable += 1;
      continue;
    }
    unmapped += mapped.unmapped;
    groups.push(mapped);
  }
  groups.sort((a, b) => Number(b.pending) - Number(a.pending));
  return { rows: groups.flatMap(group => group.rows), unmapped, unreadable };
}
