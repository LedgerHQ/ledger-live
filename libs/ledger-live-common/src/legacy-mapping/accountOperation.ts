import type { Account, Operation } from "@ledgerhq/types-live";
import {
  AccountOperationSchema,
  OperationAmountSchema,
  type AccountOperation,
} from "@domain/entity-account-operations";
import { AccountIdSchema, DateTimeIsoSchema } from "@shared/schema-primitives";

/**
 * What each of an account's ids is denominated in.
 *
 * Resolved from the account rather than decoded from the id: a token account id cannot go through
 * `decodeAccountId`, which is exactly why the entity carries `assetId` on the row instead of
 * expecting consumers to work it out.
 */
export type AssetIdResolver = (accountId: string) => string | undefined;

/** Build the resolver for one legacy account: its own currency, plus one entry per token account. */
export function assetIdsOf(account: Account): AssetIdResolver {
  const byAccountId = new Map<string, string>([[account.id, account.currency.id]]);
  for (const subAccount of account.subAccounts ?? []) {
    byAccountId.set(subAccount.id, subAccount.token.id);
  }
  return accountId => byAccountId.get(accountId);
}

/**
 * Project one legacy operation onto an entity row.
 *
 * Amounts go through the schema rather than straight out of `toFixed()`: a legacy `value` is a
 * `BigNumber` that a family could in principle leave negative or fractional, and a row that fails
 * validation is better than a row that silently breaks every `BigInt` consumer downstream.
 */
export function toAccountOperation(
  operation: Operation,
  assetId: string,
  parentOperationId?: string,
): AccountOperation {
  return AccountOperationSchema.parse({
    id: operation.id,
    accountId: AccountIdSchema.parse(operation.accountId),
    assetId,
    hash: operation.hash,
    type: operation.type,
    value: OperationAmountSchema.parse(operation.value.toFixed()),
    fee: OperationAmountSchema.parse(operation.fee.toFixed()),
    senders: operation.senders,
    recipients: operation.recipients,
    blockHeight: operation.blockHeight ?? null,
    date: DateTimeIsoSchema.parse(operation.date.toISOString()),
    ...(operation.hasFailed === undefined ? {} : { hasFailed: operation.hasFailed }),
    ...(parentOperationId === undefined ? {} : { parentOperationId }),
  });
}

/**
 * Flatten one legacy operation and everything nested inside it.
 *
 * `subOperations` (a token transfer carried by a transaction) and `internalOperations` (a contract's
 * internal transfers) live *inside* their parent on the legacy model, which is why reading a token
 * account's history means walking its parent's. Here they become sibling rows carrying
 * `parentOperationId`, and each already knows its own `accountId` — the token account's for a sub
 * operation, the main account's for an internal one.
 *
 * `nftOperations` are deliberately dropped: an NFT transfer is not a balance-bearing operation, no
 * consumer of this entity renders one, and carrying them would mean modelling the NFT collection
 * fields this slice has no business knowing.
 */
export function flattenOperation(
  operation: Operation,
  assetIdOf: AssetIdResolver,
): AccountOperation[] {
  const assetId = assetIdOf(operation.accountId);
  const rows = assetId === undefined ? [] : [toAccountOperation(operation, assetId)];
  for (const child of [
    ...(operation.subOperations ?? []),
    ...(operation.internalOperations ?? []),
  ]) {
    const childAssetId = assetIdOf(child.accountId);
    // An operation whose asset the account cannot name is dropped rather than guessed: an amount
    // rendered against the wrong magnitude is worse than an operation the list does not show.
    if (childAssetId !== undefined) {
      rows.push(toAccountOperation(child, childAssetId, operation.id));
    }
  }
  return rows;
}

/**
 * Project a full-synced account's whole history onto entity rows.
 *
 * The read half of the compatibility seam for operations: a legacy sync produces every operation the
 * account has, so this is by definition a *complete* history — which is what lets the full-sync
 * source report a `total` that a paginated read cannot.
 *
 * Token accounts are walked too. Their operations are already keyed by the token account's id, so
 * the flat table sorts them out with no extra bookkeeping.
 */
export function toAccountOperations(account: Account): AccountOperation[] {
  const assetIdOf = assetIdsOf(account);
  const own = account.operations.flatMap(operation => flattenOperation(operation, assetIdOf));
  const tokens = (account.subAccounts ?? []).flatMap(subAccount =>
    subAccount.operations.flatMap(operation => flattenOperation(operation, assetIdOf)),
  );
  // Deduplicated on the way out, first occurrence winning: a token transfer appears twice — nested
  // under the parent's operation, and again in the token account's own list — and they are the same
  // row, already carrying the token account's id. The nested one is kept because it is the one that
  // knows which transaction it came out of.
  const byId = new Map<string, AccountOperation>();
  for (const operation of [...own, ...tokens]) {
    if (!byId.has(operation.id)) byId.set(operation.id, operation);
  }
  return [...byId.values()];
}
