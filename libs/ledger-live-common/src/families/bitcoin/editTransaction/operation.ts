import { decodeAccountId, getMainAccount } from "@ledgerhq/ledger-wallet-framework/account/index";
import { DEFAULT_STUCK_TRANSACTION_TIMEOUT_MS } from "@ledgerhq/coin-bitcoin/constants";
import { Account, AccountLike, Operation } from "@ledgerhq/types-live";
import invariant from "invariant";
import { isSellOperation } from "../../../exchange/sell/sellOperations";
import { getBitcoinCoinConfig } from "../coinConfig";

const isUnconfirmed = (operation: Operation): boolean =>
  operation.blockHeight === null || operation.blockHeight === undefined;

const getInputTxIds = (operation: Operation): string[] => {
  const extra: unknown = operation.extra;
  const inputs =
    extra && typeof extra === "object" && "inputs" in extra && Array.isArray(extra.inputs)
      ? extra.inputs
      : [];
  // An input is `<txid>-<output index>`.
  return inputs
    .filter((input): input is string => typeof input === "string")
    .map(input => input.slice(0, input.lastIndexOf("-")));
};

const computePendingSellAncestorHashes = (account: Account): Set<string> => {
  const ancestors = new Set<string>();
  if (!account.sellOperationIds?.length) return ancestors;

  const unconfirmed = [...(account.pendingOperations ?? []), ...(account.operations ?? [])].filter(
    isUnconfirmed,
  );
  // A pending transaction can be listed twice, as the optimistic operation and as the explorer's
  // mempool entry, and either one can miss inputs the other has.
  const inputTxIdsByHash = new Map<string, Set<string>>();
  for (const op of unconfirmed) {
    const inputTxIds = inputTxIdsByHash.get(op.hash) ?? new Set<string>();
    for (const txId of getInputTxIds(op)) inputTxIds.add(txId);
    inputTxIdsByHash.set(op.hash, inputTxIds);
  }

  const toVisit = unconfirmed.filter(op => isSellOperation(account, op)).map(op => op.hash);
  for (let hash = toVisit.pop(); hash !== undefined; hash = toVisit.pop()) {
    for (const parent of inputTxIdsByHash.get(hash) ?? []) {
      if (inputTxIdsByHash.has(parent) && !ancestors.has(parent)) {
        ancestors.add(parent);
        toVisit.push(parent);
      }
    }
  }
  return ancestors;
};

// Accounts are replaced, never mutated, on update: an account object always has the same answer.
const pendingSellAncestorHashesCache = new WeakMap<Account, Set<string>>();

/**
 * Hashes of the unconfirmed transactions a pending sell spends from, directly or through other
 * unconfirmed transactions. Replacing one of them changes its hash, which invalidates the sell.
 */
const getPendingSellAncestorHashes = (account: Account): Set<string> => {
  let ancestors = pendingSellAncestorHashesCache.get(account);
  if (!ancestors) {
    ancestors = computePendingSellAncestorHashes(account);
    pendingSellAncestorHashesCache.set(account, ancestors);
  }
  return ancestors;
};

/**
 * Return whether an operation is editable or not for Bitcoin.
 */
export const isEditableOperation = (account: Account, operation: Operation): boolean => {
  if (isSellOperation(account, operation)) {
    return false;
  }

  // Must be unconfirmed (no blockHeight)
  if (operation.blockHeight !== null && operation.blockHeight !== undefined) {
    return false;
  }

  // Must be an outgoing transaction
  if (operation.type !== "OUT") {
    return false;
  }

  // Must not be spent from by a pending sell
  return !getPendingSellAncestorHashes(account).has(operation.hash);
};

/**
 * Return whether an operation is considered stuck or not.
 */
export const isStuckOperation = (operation: Operation): boolean => {
  /**
   * Pending operations older than the `fees.stuckTransactionTimeoutMs` of their currency
   * are considered as stuck.
   */
  const { currencyId } = decodeAccountId(operation.accountId);
  const timeoutMs =
    getBitcoinCoinConfig(currencyId).fees?.stuckTransactionTimeoutMs ??
    DEFAULT_STUCK_TRANSACTION_TIMEOUT_MS;
  return new Date().getTime() - operation.date.getTime() > timeoutMs;
};

/**
 * Return the oldest stuck pending operation and its corresponding account.
 * If no stuck pending operation is found, returns undefined
 */
export const getStuckAccountAndOperation = (
  account: AccountLike,
  parentAccount: Account | undefined | null,
):
  | {
      account: AccountLike;
      parentAccount: Account | undefined;
      operation: Operation;
    }
  | undefined => {
  const mainAccount = getMainAccount(account, parentAccount);

  if (mainAccount.currency.family !== "bitcoin") {
    return undefined;
  }

  const pendingOperations = mainAccount.pendingOperations.filter(
    pendingOp => isEditableOperation(mainAccount, pendingOp) && isStuckOperation(pendingOp),
  );
  if (pendingOperations.length === 0) {
    return undefined;
  }

  // Check that pending operations that are stuck have a corresponding operation in mainAccount.operations
  // in order to avoid returning a pending operation that is already confirmed
  const stuckOperations = mainAccount.operations.filter(op =>
    pendingOperations.some(
      pendingOp => pendingOp.id === op.id && isEditableOperation(mainAccount, op),
    ),
  );
  if (stuckOperations.length === 0) {
    return undefined;
  }

  // For Bitcoin, find the oldest by date (since we don't have sequential nonces)
  const oldestStuckOperation = stuckOperations.reduce((oldestOp, currentOp) => {
    return oldestOp.date > currentOp.date ? currentOp : oldestOp;
  });

  // Bitcoin doesn't have subaccounts in the same way as tokens
  const stuckAccount = mainAccount;

  invariant(stuckAccount, "stuckAccount required");

  return {
    account: stuckAccount,
    parentAccount: undefined,
    operation: oldestStuckOperation,
  };
};

export default {
  isEditableOperation,
  isStuckOperation,
  getStuckAccountAndOperation,
};
