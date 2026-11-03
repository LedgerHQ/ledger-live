type Balance = Readonly<{ isZero: () => boolean }>;

type ActivitySource = Readonly<{
  operations: readonly unknown[];
  pendingOperations: readonly unknown[];
  operationsCount?: number;
  balance?: Balance;
}>;

function hasRecordedActivity({
  operations,
  pendingOperations,
  operationsCount = 0,
  balance,
}: ActivitySource): boolean {
  const hasOperations = operations.length > 0 || pendingOperations.length > 0;
  const hasOperationTotal = operationsCount > 0;
  const hasBalance = balance != null && !balance.isZero();
  return hasOperations || hasOperationTotal || hasBalance;
}

export function hasAccountActivity(
  account: ActivitySource & Readonly<{ subAccounts?: readonly ActivitySource[] }>,
): boolean {
  return [account, ...(account.subAccounts ?? [])].some(hasRecordedActivity);
}
