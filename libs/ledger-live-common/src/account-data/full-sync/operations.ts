import { BigNumber } from "bignumber.js";
import type { Account, Operation } from "@ledgerhq/types-live";
import { AmountStrSchema } from "@domain/entity-account-balance";
import type { Currency } from "@domain/entity-currency";
import { findFiatCurrencyByTicker } from "@domain/entity-currency-fiat";
import {
  AccountOperationSchema,
  type AccountOperation,
  type AccountOperationsPage,
  type AccountOperationsQuery,
  type CountervalueTicker,
  type OperationId,
} from "@domain/entity-account-operation";
import { calculate, type CounterValuesCacheView } from "@domain/entity-market-countervalues";
import { toAmount } from "./balance";

/** The legacy id without its legacy account id, which the new entities never carry. */
const toOperationId = (assetId: string, op: Operation, internalIndex?: number): string => {
  // Internals can share a legacy id with each other or a top-level operation: the index tells them apart.
  if (internalIndex !== undefined) return `${assetId}-${op.hash}-${op.type}-i${internalIndex}`;
  const prefix = `${op.accountId}-`;
  const local = op.id.startsWith(prefix) ? op.id.slice(prefix.length) : `${op.hash}-${op.type}`;
  return `${assetId}-${local}`;
};

/** A token transfer the framework also files as an internal operation: its token account has the row. */
const isTokenInternal = ({ extra }: Operation) =>
  typeof extra === "object" && extra !== null && "assetReference" in extra;

const toRow = (
  nativeId: string,
  assetId: string,
  op: Operation,
  pending: boolean,
  parentId?: OperationId,
  internalIndex?: number,
): AccountOperation | undefined => {
  const parsed = AccountOperationSchema.safeParse({
    id: toOperationId(assetId, op, internalIndex),
    hash: op.hash,
    type: op.type,
    assetId,
    value: toAmount(op.value),
    // Token and internal operations repeat the parent's legacy fee: only the parent row carries it.
    fee: assetId === nativeId && internalIndex === undefined ? toAmount(op.fee) : "0",
    senders: op.senders.filter(Boolean),
    recipients: op.recipients.filter(Boolean),
    blockHeight: pending ? null : (op.blockHeight ?? null),
    // An invalid legacy date would throw: an empty one lets the schema reject the row instead.
    date: Number.isNaN(op.date.getTime()) ? "" : op.date.toISOString(),
    hasFailed: op.hasFailed,
    parentId,
  });
  return parsed.success ? parsed.data : undefined;
};

/** An operation and its sub and internal ones, which stay right after it. */
type Group = { pending: boolean; date: string; rows: AccountOperation[] };

const newestFirst = (a: string, b: string) => {
  if (a === b) return 0;
  return a < b ? 1 : -1;
};

const byPendingThenNewest = (a: Group, b: Group) =>
  Number(b.pending) - Number(a.pending) || newestFirst(a.date, b.date);

/** Each row valued in `ticker` at its date, from the rates the app holds; a row without a rate has none. */
function withCountervalues(
  rows: AccountOperation[],
  currencyOf: Map<string, Currency>,
  rates: CounterValuesCacheView,
  ticker: CountervalueTicker,
): AccountOperation[] {
  const to = findFiatCurrencyByTicker(ticker);
  if (!to) return rows;
  return rows.map(row => {
    const from = currencyOf.get(row.assetId);
    const value = from
      ? calculate(rates, { from, to, value: Number(row.value), date: new Date(row.date) })
      : undefined;
    if (typeof value !== "number") return row;
    const countervalue = AmountStrSchema.parse(toAmount(new BigNumber(value)));
    return { ...row, countervalues: { [ticker]: countervalue } };
  });
}

/** The `operations` kind of a synced account in one page, filtered and valued in memory. */
export function toAccountOperations(
  account: Account,
  query?: AccountOperationsQuery,
  rates?: CounterValuesCacheView,
): AccountOperationsPage {
  const nativeId = account.currency.id;
  const assetIdOf = new Map<string, string>([[account.id, nativeId]]);
  const currencyOf = new Map<string, Currency>([[nativeId, account.currency]]);
  for (const token of account.subAccounts ?? []) {
    assetIdOf.set(token.id, token.token.id);
    currencyOf.set(token.token.id, token.token);
  }

  // A pending operation already confirmed may carry another id: matched by hash, as the legacy lists do.
  const stale = new Set<Operation>();
  for (const { operations, pendingOperations } of [account, ...(account.subAccounts ?? [])]) {
    const confirmed = new Set(operations.map(op => op.hash));
    const confirmedOperations = new Set(operations);
    for (const op of pendingOperations) {
      if (!confirmedOperations.has(op) && confirmed.has(op.hash)) stale.add(op);
    }
  }

  const groups: Group[] = [];
  const seen = new Set<string>();
  // A malformed legacy operation is left out rather than failing the account's whole read.
  const row = (
    assetId: string,
    op: Operation,
    pending: boolean,
    parentId?: OperationId,
    internalIndex?: number,
  ) => {
    if (stale.has(op)) return undefined;
    const mapped = toRow(nativeId, assetId, op, pending, parentId, internalIndex);
    if (!mapped || seen.has(mapped.id)) return undefined;
    seen.add(mapped.id);
    return mapped;
  };
  const pushGroup = (assetId: string, op: Operation, pending: boolean) => {
    const parent = row(assetId, op, pending);
    if (!parent) return;
    const rows = [parent];
    for (const sub of op.subOperations ?? []) {
      const subAssetId = assetIdOf.get(sub.accountId);
      const child = subAssetId && row(subAssetId, sub, pending, parent.id);
      if (child) rows.push(child);
    }
    (op.internalOperations ?? []).forEach((internal, index) => {
      if (isTokenInternal(internal)) return;
      // Parents of one transaction share its internals: the first one keeps them.
      const child = row(assetId, internal, pending, parent.id, index);
      if (child) rows.push(child);
    });
    groups.push({ pending: parent.blockHeight === null, date: parent.date, rows });
  };

  const pushOperations = (assetId: string, operations: Operation[], pending: boolean) => {
    operations.forEach(op => pushGroup(assetId, op, pending));
  };

  pushOperations(nativeId, account.operations, false);
  pushOperations(nativeId, account.pendingOperations, true);
  for (const token of account.subAccounts ?? []) {
    pushOperations(token.token.id, token.operations, false);
    pushOperations(token.token.id, token.pendingOperations, true);
  }

  groups.sort(byPendingThenNewest);
  const rows = groups
    .flatMap(group => group.rows)
    .filter(row => query?.filterAsset === undefined || row.assetId === query.filterAsset);
  const ticker = query?.countervalue;
  return {
    operations: ticker && rates ? withCountervalues(rows, currencyOf, rates, ticker) : rows,
  };
}
