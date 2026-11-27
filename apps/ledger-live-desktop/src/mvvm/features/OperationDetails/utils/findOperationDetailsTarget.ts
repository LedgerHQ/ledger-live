import {
  OperationDetailsAccountNotFound,
  OperationDetailsOperationNotFound,
  type OperationDetailsRequest,
} from "@features/platform-wallet-api-operation-details";
import { getAccountIdFromWalletAccountId } from "@ledgerhq/live-common/wallet-api/converters";
import type { AccountLike, Operation } from "@ledgerhq/types-live";

export type OperationDetailsTarget = {
  accountId: string;
  parentId: string | undefined;
  operation: Operation;
};

export function findOperationDetailsTarget(
  accounts: readonly AccountLike[],
  { walletAccountId, transactionHash }: OperationDetailsRequest,
): OperationDetailsTarget {
  const accountId = getAccountIdFromWalletAccountId(walletAccountId);
  const account = accounts.find(candidate => candidate.id === accountId);
  if (!account) throw new OperationDetailsAccountNotFound(`No account for ${walletAccountId}`);

  const operation =
    account.operations.find(candidate => candidate.hash === transactionHash) ??
    account.pendingOperations.find(candidate => candidate.hash === transactionHash);
  if (!operation) throw new OperationDetailsOperationNotFound(`No operation ${transactionHash}`);

  return {
    accountId: account.id,
    parentId: account.type === "TokenAccount" ? account.parentId : undefined,
    operation,
  };
}
