import { getMainAccount } from "@ledgerhq/ledger-wallet-framework/account/helpers";
import type { Account, AccountLike, Operation } from "@ledgerhq/types-live";
import { loadBridgeExtensionsForFamily } from "./coin-modules/registry";
import { defaultBridgeExtensions } from "./bridge/defaultBridgeExtensions";
export * from "@ledgerhq/ledger-wallet-framework/operation";

/**
 * @deprecated Acquire the bridge first via `useAccountBridge(account)` (React)
 * or `getAccountBridge(account)` (non-React), then call
 * `bridge.isEditableOperation(account, operation)`.
 */
export const isEditableOperation = ({
  account,
  operation,
}: {
  account: Account;
  operation: Operation;
}): boolean =>
  (loadBridgeExtensionsForFamily(account.currency.family).isEditableOperation ??
    defaultBridgeExtensions.isEditableOperation)(account, operation);

/**
 * @deprecated Acquire the bridge first via `getAccountBridgeByFamily(family)`,
 * then call `bridge.isStuckOperation(operation)`.
 */
export const isStuckOperation = ({
  family,
  operation,
}: {
  family: string;
  operation: Operation;
}): boolean =>
  (loadBridgeExtensionsForFamily(family).isStuckOperation ??
    defaultBridgeExtensions.isStuckOperation)(operation);

/**
 * @deprecated Acquire the bridge first via `useAccountBridge(account, parentAccount)` (React)
 * or `getAccountBridge(account, parentAccount)` (non-React), then call
 * `bridge.getStuckAccountAndOperation(account, parentAccount)`.
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
  return (loadBridgeExtensionsForFamily(mainAccount.currency.family).getStuckAccountAndOperation ??
    defaultBridgeExtensions.getStuckAccountAndOperation)(account, parentAccount);
};
