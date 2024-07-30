import { useQueries, UseQueryResult } from "@tanstack/react-query";
import { QueryKey } from "./type.hooks";
import TrustchainApi, { StatusAPIResponse as TrustchainStatus } from "@ledgerhq/trustchain/api";
import CloudSyncApi, {
  StatusAPIResponse as CloudSyncStatus,
} from "@ledgerhq/live-wallet/cloudsync/api";

export function useLedgerSyncInfo() {
  const QUERIES = [
    {
      queryKey: [QueryKey.fetchTrustchainStatus],
      queryFn: () => TrustchainApi.fetchStatus(),
    },
    {
      queryKey: [QueryKey.fetchCloudSyncStatus],
      queryFn: () => CloudSyncApi.fetchStatus(),
    },
  ];

  return useQueries({
    queries: QUERIES,
    combine: combineData,
  });
}

function combineData(results: UseQueryResult<TrustchainStatus | CloudSyncStatus, Error>[]) {
  return {
    error: results.find(result => result.isError)?.error || null,
    isLoading: results.some(result => result.isLoading),
    isError: results.some(result => result.isError),
  };
}
