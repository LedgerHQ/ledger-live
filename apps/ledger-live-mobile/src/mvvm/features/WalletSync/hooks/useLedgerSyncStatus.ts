import { useQueries, UseQueryResult } from "@tanstack/react-query";
import { QueryKey } from "./type.hooks";
import type { StatusAPIResponse } from "@shared/cloud-sync";
import { useFeature } from "@features/platform-feature-flags";
import { getLedgerSyncStatus } from "@features/platform-wallet-sync";
import { useDispatch } from "~/context/hooks";

export function useLedgerSyncStatus() {
  const featureWalletSync = useFeature("llmWalletSync");
  const isWalletSyncEnabled = featureWalletSync?.enabled === true;
  const dispatch = useDispatch();
  const QUERIES = [
    {
      queryKey: [QueryKey.fetchTrustchainStatus],
      queryFn: () => getLedgerSyncStatus(dispatch).fetchLkrpStatus(),
      enabled: isWalletSyncEnabled,
    },
    {
      queryKey: [QueryKey.fetchCloudSyncStatus],
      queryFn: () => getLedgerSyncStatus(dispatch).fetchCloudSyncStatus(),
      enabled: isWalletSyncEnabled,
    },
  ];

  return useQueries({
    queries: QUERIES,
    combine: combineData,
  });
}

function combineData(results: UseQueryResult<StatusAPIResponse, Error>[]) {
  return {
    error: results.find(result => result.isError)?.error || null,
    isLoading: results.some(result => result.isLoading),
    isError: results.some(result => result.isError),
  };
}
