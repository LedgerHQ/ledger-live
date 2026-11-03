import { AccountDataNotServedError } from "@domain/api-account-data";
import {
  AccountOperationSchema,
  type AccountOperation,
  type OperationId,
} from "@domain/entity-account-operation";
import type { CoinModuleOperation, CoinModuleOperationsApi } from "../host";

/** The native types whose legacy value counts the fees the account paid. */
const FEES_SPENDING_TYPES: ReadonlySet<string> = new Set([
  "OUT",
  "FEES",
  "DELEGATE",
  "UNDELEGATE",
  "REDELEGATE",
  "CONTRACT_CALL",
  "UPDATE_ACCOUNT",
]);

const NFT_TYPES: ReadonlySet<string> = new Set(["NFT_IN", "NFT_OUT"]);

const isNative = ({ asset }: CoinModuleOperation) => asset.type === "native";

/** The transaction's own native operation, not one of its internal ones: it pays the fees, its token and internal operations point at it. */
const isParent = ({ asset, details }: CoinModuleOperation) =>
  asset.type === "native" && details?.internal !== true;

const ledgerTypeOf = ({ type, details }: CoinModuleOperation) =>
  typeof details?.ledgerOpType === "string" ? details.ledgerOpType : type;

/** Left out as the legacy sync leaves them out: NFT transfers, and failed transfers received. */
const isListed = (op: CoinModuleOperation) => {
  const ledgerType = ledgerTypeOf(op);
  return !NFT_TYPES.has(ledgerType) && !(op.tx.failed && ledgerType === "IN");
};

const toAmount = (value: bigint) => (value > 0n ? value : 0n).toString();

/** A failed transaction moved nothing but its fees. */
function amountsOf(op: CoinModuleOperation) {
  const fee = isParent(op) ? op.tx.fees : 0n;
  if (op.tx.failed) return { value: toAmount(fee), fee: toAmount(fee) };
  const value = isParent(op) && FEES_SPENDING_TYPES.has(op.type) ? op.value + fee : op.value;
  return { value: toAmount(value), fee: toAmount(fee) };
}

/** An operation the account lists, with the asset its row is in. */
export type ListedOperation = { op: CoinModuleOperation; assetId: string };

const dateOf = ({ date }: CoinModuleOperation["tx"]) =>
  Number.isNaN(date.getTime()) ? "" : date.toISOString();

const parse = (row: unknown) => {
  const parsed = AccountOperationSchema.safeParse(row);
  return parsed.success ? parsed.data : undefined;
};

// A malformed operation is left out rather than failing the account's whole page.
const toRow = ({ op, assetId }: ListedOperation, parentId?: OperationId) =>
  parse({
    id: `${assetId}-${op.id}`,
    hash: op.tx.hash,
    type: op.type,
    assetId,
    ...amountsOf(op),
    senders: op.senders.filter(Boolean),
    recipients: op.recipients.filter(Boolean),
    blockHeight: op.tx.block.height,
    date: dateOf(op.tx),
    hasFailed: op.tx.failed,
    parentId,
  });

const stringsOf = (value: unknown) =>
  Array.isArray(value) && value.every(item => typeof item === "string") ? value : undefined;

/** The fees the account paid for a transaction a coin module lists no native operation of, as the legacy sync shows them. */
function feesRowOf(currencyId: string, subject: string, { tx, details }: CoinModuleOperation) {
  if (tx.fees <= 0n || tx.feesPayer?.toLowerCase() !== subject.toLowerCase()) return undefined;
  return parse({
    id: `${currencyId}-${tx.hash}-FEES`,
    hash: tx.hash,
    type: "FEES",
    assetId: currencyId,
    value: tx.fees.toString(),
    fee: tx.fees.toString(),
    senders: stringsOf(details?.parentSenders) ?? [subject],
    recipients: stringsOf(details?.parentRecipients) ?? [],
    blockHeight: tx.block.height,
    date: dateOf(tx),
    hasFailed: tx.failed,
  });
}

/** The rows of one transaction, its parent first. */
type Group = { date: string; first: CoinModuleOperation; rows: AccountOperation[] };

const newestFirst = (a: Group, b: Group) => {
  if (a.date === b.date) return 0;
  return a.date < b.date ? 1 : -1;
};

/** The operations the account lists, each with its asset: NFT transfers, failed transfers received, unlisted and blacklisted tokens left out. */
export async function listedOperationsOf(
  currencyId: string,
  items: CoinModuleOperation[],
  { getTokenId }: CoinModuleOperationsApi,
  blacklistedTokenIds: ReadonlySet<string>,
): Promise<ListedOperation[]> {
  const listed = items.filter(isListed);
  if (!getTokenId && !listed.every(isNative)) {
    throw new AccountDataNotServedError(`No token resolver for the ${currencyId} coin module`);
  }
  const withAssets = await Promise.all(
    listed.map(async op => ({
      op,
      assetId: isNative(op) ? currencyId : await getTokenId?.(op.asset),
    })),
  );
  return withAssets.flatMap(({ op, assetId }) =>
    assetId === undefined || blacklistedTokenIds.has(assetId) ? [] : [{ op, assetId }],
  );
}

/** The `operations` rows of an account: newest first, token and internal operations as rows of their own, pointing at their transaction's parent. */
export function toAccountOperations(
  currencyId: string,
  subject: string,
  operations: readonly ListedOperation[],
): AccountOperation[] {
  const groups = new Map<string, Group>();
  for (const { op } of operations) {
    if (!groups.has(op.tx.hash)) {
      groups.set(op.tx.hash, { date: dateOf(op.tx), first: op, rows: [] });
    }
  }
  const seen = new Set<string>();
  const parentIds = new Map<string, OperationId>();
  const push = (hash: string, row: AccountOperation | undefined) => {
    if (!row || seen.has(row.id)) return undefined;
    seen.add(row.id);
    groups.get(hash)?.rows.push(row);
    return row;
  };
  const pushParent = (hash: string, row: AccountOperation | undefined) => {
    const pushed = push(hash, row);
    if (pushed && !parentIds.has(hash)) parentIds.set(hash, pushed.id);
  };
  // Parents first, so a token operation listed before its transaction's native one still points at it.
  for (const listed of operations) {
    if (isParent(listed.op)) pushParent(listed.op.tx.hash, toRow(listed));
  }
  // A coin module may leave out the native operation of a transaction that only moved tokens.
  for (const [hash, { first }] of groups) {
    if (!parentIds.has(hash)) pushParent(hash, feesRowOf(currencyId, subject, first));
  }
  for (const listed of operations) {
    const hash = listed.op.tx.hash;
    if (!isParent(listed.op)) push(hash, toRow(listed, parentIds.get(hash)));
  }
  return [...groups.values()].sort(newestFirst).flatMap(group => group.rows);
}
