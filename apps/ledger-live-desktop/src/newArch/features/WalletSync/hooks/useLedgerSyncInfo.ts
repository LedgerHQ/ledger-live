import { useQueries, UseQueryResult } from "@tanstack/react-query";
import { QueryKey } from "./type.hooks";
import getTrustchainApi, { StatusAPIResponse as TrustchainStatus } from "@ledgerhq/trustchain/api";
import getCloudSyncApi, {
  StatusAPIResponse as CloudSyncStatus,
} from "@ledgerhq/live-wallet/cloudsync/api";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import getWalletSyncEnvironmentParams from "@ledgerhq/live-common/walletSync/getEnvironmentParams";

export function useLedgerSyncInfo() {
  const featureWalletSync = useFeature("lldWalletSync");
  const { trustchainApiBaseUrl, cloudSyncApiBaseUrl } = getWalletSyncEnvironmentParams(
    featureWalletSync?.params?.environment,
  );
  const QUERIES = [
    {
      queryKey: [QueryKey.fetchTrustchainStatus],
      queryFn: () => getTrustchainApi(trustchainApiBaseUrl).fetchStatus(),
    },
    {
      queryKey: [QueryKey.fetchCloudSyncStatus],
      queryFn: () => getCloudSyncApi(cloudSyncApiBaseUrl).fetchStatus(),
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
