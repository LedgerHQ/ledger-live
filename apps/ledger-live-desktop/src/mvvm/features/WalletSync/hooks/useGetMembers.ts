import { useLedgerSyncMembers } from "@features/platform-ledger-sync";
import { useKeyRingClient } from "./useKeyRingClient";
import { useLifeCycle } from "./walletSync.hooks";

export function useGetMembers() {
  const client = useKeyRingClient();
  const { handleError } = useLifeCycle();
  const { isLoading, data, isError, error } = useLedgerSyncMembers({
    client,
    onError: handleError,
  });

  return {
    isMembersLoading: isLoading,
    instances: data,
    isError,
    error,
  };
}
