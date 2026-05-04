import { getMainAccount } from "@ledgerhq/ledger-wallet-framework/account/helpers";
import type { Account, AccountLike, Operation } from "@ledgerhq/types-live";
import { getAccountBridge, getAccountBridgeByFamily } from "./bridge";
export * from "@ledgerhq/ledger-wallet-framework/operation";

/**
 * @deprecated Use `useAccountBridge` to access the bridge synchronously, then call
 * `bridge.isEditableOperation?.(account, operation) ?? false` inline.
 * These helpers will be removed once `getAccountBridge` becomes async.
 */
export const isEditableOperation = ({
  account,
  operation,
}: {
  account: Account;
  operation: Operation;
}): boolean => {
  let bridge;
  try {
    bridge = getAccountBridge(account);
  } catch {
    return false;
  }
  return bridge.isEditableOperation?.(account, operation) ?? false;
};

/**
 * @deprecated Use `useAccountBridge` to access the bridge synchronously, then call
 * `bridge.isStuckOperation?.(operation) ?? false` inline.
 * These helpers will be removed once `getAccountBridge` becomes async.
 */
export const isStuckOperation = ({
  family,
  operation,
}: {
  family: string;
  operation: Operation;
}): boolean => {
  let bridge;
  try {
    bridge = getAccountBridgeByFamily(family);
  } catch {
    return false;
  }
  return bridge.isStuckOperation?.(operation) ?? false;
};

/**
 * @deprecated Use `useAccountBridge` to access the bridge synchronously, then call
 * `bridge.getStuckAccountAndOperation?.(account, parentAccount)` inline.
 * These helpers will be removed once `getAccountBridge` becomes async.
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
  let bridge;
  try {
    bridge = getAccountBridge(mainAccount);
  } catch {
    return undefined;
  }
  return bridge.getStuckAccountAndOperation?.(account, parentAccount);
};
