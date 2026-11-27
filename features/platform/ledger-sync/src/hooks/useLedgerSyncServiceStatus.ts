import { useQueries, type UseQueryResult } from "@tanstack/react-query";
import { getCloudSyncApi } from "@shared/cloud-sync";
import { LedgerSyncQueryKey } from "../logic/queryKeys";
import type { LedgerSyncServiceStatus, LedgerSyncServiceStatusOptions } from "../types";

/**
 * The health of the key ring and Cloud Sync backends, for the Ledger Sync settings and the
 * screens that warn when Ledger Sync is down.
 *
 * @example
 * ```ts
 * const { cloudSyncApiBaseUrl } = useLedgerSyncBackends();
 * const { isError, error } = useLedgerSyncServiceStatus({
 *   client: useKeyRingClient(),
 *   cloudSyncApiBaseUrl,
 *   enabled: featureWalletSync?.enabled === true,
 * });
 * ```
 */
export function useLedgerSyncServiceStatus({
  client,
  cloudSyncApiBaseUrl,
  enabled,
}: LedgerSyncServiceStatusOptions): LedgerSyncServiceStatus {
  const enabledOption = enabled === undefined ? {} : { enabled };
  return useQueries({
    queries: [
      {
        queryKey: [LedgerSyncQueryKey.keyRingStatus],
        queryFn: () => client.serviceStatus(),
        ...enabledOption,
      },
      {
        queryKey: [LedgerSyncQueryKey.cloudSyncStatus],
        queryFn: () => getCloudSyncApi(cloudSyncApiBaseUrl).fetchStatus(),
        ...enabledOption,
      },
    ],
    combine: combineServiceStatus,
  });
}

function combineServiceStatus(results: UseQueryResult<unknown, Error>[]): LedgerSyncServiceStatus {
  return {
    error: results.find(result => result.isError)?.error || null,
    isLoading: results.some(result => result.isLoading),
    isError: results.some(result => result.isError),
  };
}
