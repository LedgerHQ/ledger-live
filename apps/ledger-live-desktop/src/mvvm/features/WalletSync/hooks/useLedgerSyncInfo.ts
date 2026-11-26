import { useMemo } from "react";
import { useQueries, UseQueryResult } from "@tanstack/react-query";
import { QueryKey } from "./type.hooks";
import { selectKeyRingTreeId } from "@domain/entity-key-ring";
import {
  fetchKeyRingServiceStatus,
  selectKeyRingSession,
  type KeyRingServiceStatus,
} from "@features/platform-key-ring";
import { getCloudSyncApi, StatusAPIResponse as CloudSyncStatus } from "@shared/cloud-sync";
import { useFeature } from "@features/platform-feature-flags";
import getWalletSyncEnvironmentParams from "@ledgerhq/live-common/walletSync/getEnvironmentParams";
import { useSelector } from "LLD/hooks/redux";
import { walletSelector } from "~/renderer/reducers/wallet";
import { useKeyRingClient } from "./useKeyRingClient";

export function useLedgerSyncInfo() {
  const treeId = useSelector(selectKeyRingTreeId);
  const session = useSelector(selectKeyRingSession);
  const keyRing = useKeyRingClient();
  const streamPath = useMemo(
    () => keyRing.openStream(session)?.ref.streamPath ?? null,
    [keyRing, session],
  );
  const walletState = useSelector(walletSelector);

  const featureWalletSync = useFeature("lldWalletSync");
  const { trustchainApiBaseUrl, cloudSyncApiBaseUrl } = getWalletSyncEnvironmentParams(
    featureWalletSync?.params?.environment,
  );
  const QUERIES = [
    {
      queryKey: [QueryKey.fetchTrustchainStatus],
      queryFn: () => fetchKeyRingServiceStatus(trustchainApiBaseUrl),
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
    treeId,
    streamPath,
    walletState,
  };
}

function combineData(results: UseQueryResult<KeyRingServiceStatus | CloudSyncStatus, Error>[]) {
  return {
    error: results.find(result => result.isError)?.error || null,
    isLoading: results.some(result => result.isLoading),
    isError: results.some(result => result.isError),
  };
}
