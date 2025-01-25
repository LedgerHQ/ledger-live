import { useQueries, UseQueryResult } from "@tanstack/react-query";
import { QueryKey } from "./type.hooks";
import getTrustchainApi, {
  StatusAPIResponse as TrustchainStatus,
} from "@ledgerhq/ledger-key-ring-protocol/api";
import getCloudSyncApi, {
  StatusAPIResponse as CloudSyncStatus,
} from "@ledgerhq/live-wallet/cloudsync/api";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import getWalletSyncEnvironmentParams from "@ledgerhq/live-common/walletSync/getEnvironmentParams";
import { trustchainSelector } from "@ledgerhq/ledger-key-ring-protocol/store";
import { useSelector } from "react-redux";
import { walletSelector } from "~/renderer/reducers/wallet";

export function useLedgerSyncInfo() {
  const trustchain = useSelector(trustchainSelector);
  const walletState = useSelector(walletSelector);

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

  const statusQuery = useQueries({
    queries: QUERIES,
    combine: combineData,
  });

  return {
    statusQuery,
    trustchain,
    walletState,
  };
}

function combineData(results: UseQueryResult<TrustchainStatus | CloudSyncStatus, Error>[]) {
  return {
    error: results.find(result => result.isError)?.error || null,
    isLoading: results.some(result => result.isLoading),
    isError: results.some(result => result.isError),
  };
}
