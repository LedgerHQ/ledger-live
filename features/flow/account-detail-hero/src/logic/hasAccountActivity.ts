type WithOperations = Readonly<{
  operations: readonly unknown[];
  pendingOperations: readonly unknown[];
}>;

export function hasAccountActivity(
  account: WithOperations & Readonly<{ subAccounts?: readonly WithOperations[] }>,
): boolean {
  return [account, ...(account.subAccounts ?? [])].some(
    ({ operations, pendingOperations }) => operations.length > 0 || pendingOperations.length > 0,
  );
}
