import { useQueries, UseQueryResult } from "@tanstack/react-query";
import { QueryKey } from "./type.hooks";
import { fetchKeyRingServiceStatus, type KeyRingServiceStatus } from "@features/platform-key-ring";
import { getCloudSyncApi, StatusAPIResponse as CloudSyncStatus } from "@shared/cloud-sync";
import { useFeature } from "@features/platform-feature-flags";
import getWalletSyncEnvironmentParams from "@ledgerhq/live-common/walletSync/getEnvironmentParams";

export function useLedgerSyncStatus() {
  const featureWalletSync = useFeature("llmWalletSync");
  const isWalletSyncEnabled = featureWalletSync?.enabled === true;
  const { trustchainApiBaseUrl, cloudSyncApiBaseUrl } = getWalletSyncEnvironmentParams(
    featureWalletSync?.params?.environment,
  );
  const QUERIES = [
    {
      queryKey: [QueryKey.fetchTrustchainStatus],
      queryFn: () => fetchKeyRingServiceStatus(trustchainApiBaseUrl),
      enabled: isWalletSyncEnabled,
    },
    {
      queryKey: [QueryKey.fetchCloudSyncStatus],
      queryFn: () => getCloudSyncApi(cloudSyncApiBaseUrl).fetchStatus(),
      enabled: isWalletSyncEnabled,
    },
  ];

  return useQueries({
    queries: QUERIES,
    combine: combineData,
  });
}

function combineData(results: UseQueryResult<KeyRingServiceStatus | CloudSyncStatus, Error>[]) {
  return {
    error: results.find(result => result.isError)?.error || null,
    isLoading: results.some(result => result.isLoading),
    isError: results.some(result => result.isError),
  };
}
