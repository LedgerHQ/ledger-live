import { decodeAccountId, getMainAccount } from "@ledgerhq/ledger-wallet-framework/account/index";
import { DEFAULT_STUCK_TRANSACTION_TIMEOUT_MS } from "@ledgerhq/coin-bitcoin/constants";
import { Account, AccountLike, Operation } from "@ledgerhq/types-live";
import invariant from "invariant";
import { getBitcoinCoinConfig } from "../coinConfig";

/**
 * Return whether an operation is editable or not for Bitcoin.
 */
export const isEditableOperation = (_account: Account, operation: Operation): boolean => {
  // Must be unconfirmed (no blockHeight)
  if (operation.blockHeight !== null && operation.blockHeight !== undefined) {
    return false;
  }

  // Must be an outgoing transaction
  if (operation.type !== "OUT") {
    return false;
  }

  return true;
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
