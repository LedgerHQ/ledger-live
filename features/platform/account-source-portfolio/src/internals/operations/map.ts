import { BigNumber } from "bignumber.js";
import type { AssetChange, UpdateView } from "@domain/api-account-portfolio";
import type { BalanceAssetId } from "@domain/entity-account-balance";
import {
  AccountOperationSchema,
  type AccountOperation,
  type OperationId,
  type OperationType,
} from "@domain/entity-account-operation";
import type { AccountDescriptor } from "@domain/entity-account-descriptor";
import type { Fiat } from "./read";

/** `unmapped`: token changes with no CAL id, left out. `unreadable`: updates that could not be read. */
export type MappedOperations = {
  rows: AccountOperation[];
  unmapped: number;
  unreadable: number;
};

export type MapOptions = {
  /** Values each row with the changes' `currency_value`, read in this fiat. */
  fiat?: Fiat;
  /** Keeps only the rows of this asset. */
  filterAsset?: BalanceAssetId;
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

type Change = { amount: bigint; worth: BigNumber | null };

/** The net change per asset, with its worth, null once one change has none: the account's coin for `native`, the CAL id for a token. */
function changesOf(descriptor: AccountDescriptor, deltas: readonly AssetChange[]) {
  const changes = new Map<string, Change>([
    [descriptor.network, { amount: 0n, worth: new BigNumber(0) }],
  ]);
  let unmapped = 0;
  for (const delta of deltas) {
    const assetId = delta.asset === "native" ? descriptor.network : (delta.cal_id ?? undefined);
    if (assetId === undefined) {
      unmapped += 1;
      continue;
    }
    const sum = changes.get(assetId) ?? { amount: 0n, worth: new BigNumber(0) };
    const worth = delta.currency_value ?? null;
    changes.set(assetId, {
      amount: sum.amount + BigInt(delta.amount),
      worth: sum.worth === null || worth === null ? null : sum.worth.plus(worth),
    });
  }
  return { changes, unmapped };
}

/** The fiat's smallest unit, half up, as the operations entity stores a countervalue. */
function countervaluesOf(worth: BigNumber | null, fiat: Fiat | undefined) {
  if (!fiat || worth === null) return undefined;
  const value = worth.abs().shiftedBy(fiat.magnitude).integerValue(BigNumber.ROUND_HALF_UP);
  return { countervalues: { [fiat.ticker]: value.toFixed(0) } };
}

/** The native row, then one row per token changed, pointing at it. Undefined when unreadable. */
function rowsOf(descriptor: AccountDescriptor, update: UpdateView, fiat: Fiat | undefined) {
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
    if (parentId !== undefined && change.amount === 0n) continue;
    const type = parentId === undefined ? typeOf(change.amount, fee) : typeOf(change.amount);
    const parsed = AccountOperationSchema.safeParse({
      id: `${assetId}-${update.tx.hash}-${type}`,
      hash: update.tx.hash,
      type,
      assetId,
      value: abs(change.amount).toString(),
      fee: parentId === undefined ? fee.toString() : "0",
      senders: update.senders ?? [],
      recipients: update.recipients ?? [],
      blockHeight,
      date,
      hasFailed: update.failed,
      parentId,
      ...countervaluesOf(change.worth, fiat),
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
  { fiat, filterAsset }: MapOptions = {},
): MappedOperations {
  let unmapped = 0;
  let unreadable = 0;
  const groups: { rows: AccountOperation[]; pending: boolean }[] = [];
  for (const update of updates) {
    const mapped = rowsOf(descriptor, update, fiat);
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
