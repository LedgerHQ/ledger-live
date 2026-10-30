import React, { useMemo, type ReactNode } from "react";
import { USE_ACCOUNT_DATA_OPERATIONS } from "LLD/features/History/constants";
import { AccountOperationsQueries } from "LLD/features/History/components/AccountOperationsQueries";
import { useAccountDataOperationItems } from "LLD/features/History/hooks/useAccountDataOperationItems";
import { filterOperationTableItemsByAllowedAccountIds } from "LLD/features/History/utils/accountScopeForHistory";
import { OperationsSkeleton } from "../OperationsSkeleton";
import { RecentTransactionsView } from "./RecentTransactionsView";
import { useRecentAccountScope } from "./useRecentAccountScope";
import {
  useRecentTransactionItems,
  useRecentTransactionsViewModel,
  type RecentTransactionsParams,
  type RecentTransactionsViewModel,
} from "./useRecentTransactionsViewModel";

export type RecentTransactionsProps = RecentTransactionsParams &
  Readonly<{
    title: string;
    testIdPrefix: string;
    fallback?: ReactNode;
  }>;

function RecentTransactionsScreen({
  title,
  testIdPrefix,
  fallback,
  viewModel,
}: Readonly<{
  title: string;
  testIdPrefix: string;
  fallback: ReactNode;
  viewModel: RecentTransactionsViewModel;
}>) {
  if (viewModel.pending && !viewModel.visible) return <OperationsSkeleton />;
  if (!viewModel.visible) return <>{fallback}</>;

  return (
    <RecentTransactionsView
      title={title}
      testIdPrefix={testIdPrefix}
      table={viewModel.table}
      onRowClick={viewModel.onRowClick}
      onSeeAll={viewModel.onSeeAll}
    />
  );
}

function LegacyRecentTransactions({
  title,
  testIdPrefix,
  fallback = null,
  ...params
}: RecentTransactionsProps) {
  const items = useRecentTransactionItems(params.accountIds);
  const viewModel = useRecentTransactionsViewModel({ ...params, items, pending: false });
  return (
    <RecentTransactionsScreen
      title={title}
      testIdPrefix={testIdPrefix}
      fallback={fallback}
      viewModel={viewModel}
    />
  );
}

function AccountDataRecentTransactions({
  title,
  testIdPrefix,
  fallback = null,
  ...params
}: RecentTransactionsProps) {
  const { allowedAccountIds, rootAccounts } = useRecentAccountScope(params.accountIds);
  const { items, targets, pending } = useAccountDataOperationItems(rootAccounts);
  const scopedItems = useMemo(
    () => filterOperationTableItemsByAllowedAccountIds(items, allowedAccountIds),
    [allowedAccountIds, items],
  );
  const viewModel = useRecentTransactionsViewModel({ ...params, items: scopedItems, pending });
  return (
    <>
      <AccountOperationsQueries targets={targets} />
      <RecentTransactionsScreen
        title={title}
        testIdPrefix={testIdPrefix}
        fallback={fallback}
        viewModel={viewModel}
      />
    </>
  );
}

export function RecentTransactions(props: RecentTransactionsProps) {
  return USE_ACCOUNT_DATA_OPERATIONS ? (
    <AccountDataRecentTransactions {...props} />
  ) : (
    <LegacyRecentTransactions {...props} />
  );
}
