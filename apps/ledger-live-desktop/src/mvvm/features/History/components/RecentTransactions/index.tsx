import React, { type ReactNode } from "react";
import { RecentTransactionsView } from "./RecentTransactionsView";
import {
  useRecentTransactionsViewModel,
  type RecentTransactionsParams,
} from "./useRecentTransactionsViewModel";

export type RecentTransactionsProps = RecentTransactionsParams &
  Readonly<{
    title: string;
    testIdPrefix: string;
    fallback?: ReactNode;
  }>;

export function RecentTransactions({
  title,
  testIdPrefix,
  fallback = null,
  ...params
}: RecentTransactionsProps) {
  const { visible, table, onRowClick, onSeeAll } = useRecentTransactionsViewModel(params);

  if (!visible) return <>{fallback}</>;

  return (
    <RecentTransactionsView
      title={title}
      testIdPrefix={testIdPrefix}
      table={table}
      onRowClick={onRowClick}
      onSeeAll={onSeeAll}
    />
  );
}
