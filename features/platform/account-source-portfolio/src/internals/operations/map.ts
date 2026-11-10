import type { AssetChange, UpdateView } from "@domain/api-account-portfolio";
import type { CryptoOrTokenCurrencyId } from "@domain/entity-currency";
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

export type MapOptions = {
  /** Keeps only the rows of this asset. */
  filterAsset?: CryptoOrTokenCurrencyId;
};

const SIGNED_INTEGER = /^-?\d+$/;

const abs = (value: bigint) => (value < 0n ? -value : value);

/** A native outflow equal to the fee is a fee-only operation, such as a token send. */
function typeOf(change: bigint, fee?: bigint): OperationType {
  if (fee !== undefined && fee > 0n && change === -fee) return "FEES";
  if (change > 0n) return "IN";
  if (change < 0n) return "OUT";
  return "NONE";
}

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
  const blockHeight = update.block?.height ?? null;
  const fee = abs(BigInt(update.fee.amount));
  const date = isoDate(update.time);
  const rows: AccountOperation[] = [];
  let parentId: OperationId | undefined;
  for (const [assetId, change] of changes) {
    if (parentId !== undefined && change === 0n) continue;
    const type = parentId === undefined ? typeOf(change, fee) : typeOf(change);
    const parsed = AccountOperationSchema.safeParse({
      id: `${assetId}-${update.tx.hash}-${type}`,
      hash: update.tx.hash,
      type,
      assetId,
      value: abs(change).toString(),
      fee: parentId === undefined ? fee.toString() : "0",
      senders: update.senders ?? [],
      recipients: update.recipients ?? [],
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
  { filterAsset }: MapOptions = {},
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
  const rows = groups.flatMap(group => group.rows);
  return {
    rows: filterAsset === undefined ? rows : rows.filter(row => row.assetId === filterAsset),
    unmapped,
    unreadable,
  };
}
