import { useQueries, UseQueryResult } from "@tanstack/react-query";
import { QueryKey } from "./type.hooks";
import type { StatusAPIResponse } from "@shared/cloud-sync";
import { getLedgerSyncStatus } from "@features/platform-wallet-sync";
import { trustchainSelector } from "@ledgerhq/ledger-key-ring-protocol/store";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { walletSelector } from "~/renderer/reducers/wallet";

export function useLedgerSyncInfo() {
  const trustchain = useSelector(trustchainSelector);
  const walletState = useSelector(walletSelector);
  const dispatch = useDispatch();

  const QUERIES = [
    {
      queryKey: [QueryKey.fetchTrustchainStatus],
      queryFn: () => getLedgerSyncStatus(dispatch).fetchLkrpStatus(),
    },
    {
      queryKey: [QueryKey.fetchCloudSyncStatus],
      queryFn: () => getLedgerSyncStatus(dispatch).fetchCloudSyncStatus(),
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

function combineData(results: UseQueryResult<StatusAPIResponse, Error>[]) {
  return {
    error: results.find(result => result.isError)?.error || null,
    isLoading: results.some(result => result.isLoading),
    isError: results.some(result => result.isError),
  };
}
