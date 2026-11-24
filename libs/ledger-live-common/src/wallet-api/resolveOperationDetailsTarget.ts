import type { AccountLike, Operation } from "@ledgerhq/types-live";
import { z } from "zod";
import { getAccountIdFromWalletAccountId } from "./converters";

const OpenOperationDetailsParamsSchema = z.object({
  accountId: z.string().min(1),
  transactionHash: z.string().min(1),
});

export type OperationDetailsTarget = {
  accountId: string;
  parentId: string | undefined;
  operation: Operation;
};

function findOperationByHash(account: AccountLike, hash: string): Operation | undefined {
  return (
    account.operations.find(operation => operation.hash === hash) ??
    account.pendingOperations.find(operation => operation.hash === hash)
  );
}

export function resolveOperationDetailsTarget(
  params: unknown,
  accounts: readonly AccountLike[],
): OperationDetailsTarget {
  const parsed = OpenOperationDetailsParamsSchema.safeParse(params);
  if (!parsed.success) {
    throw new TypeError(
      "Invalid params for custom.openOperationDetails: expected non-empty string 'accountId' and 'transactionHash'.",
    );
  }

  const accountId = getAccountIdFromWalletAccountId(parsed.data.accountId);
  if (!accountId) throw new Error("Invalid accountId");

  const account = accounts.find(candidate => candidate.id === accountId);
  if (!account) throw new Error("Account not found");

  const operation = findOperationByHash(account, parsed.data.transactionHash);
  if (!operation) throw new Error("Operation not found");

  return {
    accountId: account.id,
    parentId: account.type === "TokenAccount" ? account.parentId : undefined,
    operation,
  };
}
