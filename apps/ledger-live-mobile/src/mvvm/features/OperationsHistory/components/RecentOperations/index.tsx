import React, { type ReactNode } from "react";
import { RecentOperationsView } from "./RecentOperationsView";
import {
  useRecentOperationsViewModel,
  type RecentOperationsParams,
} from "./useRecentOperationsViewModel";

export type RecentOperationsProps = RecentOperationsParams &
  Readonly<{
    title: string;
    testID: string;
    headerTestID: string;
    fallback?: ReactNode;
  }>;

export function RecentOperations({
  title,
  testID,
  headerTestID,
  fallback = null,
  ...params
}: RecentOperationsProps) {
  return (
    <RecentOperationsView
      {...useRecentOperationsViewModel(params)}
      title={title}
      testID={testID}
      headerTestID={headerTestID}
      fallback={fallback}
    />
  );
}
