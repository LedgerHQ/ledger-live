import { useLedgerSyncMembers, type LedgerSyncMembers } from "@features/platform-ledger-sync";
import { useKeyRingClient } from "./useKeyRingClient";
import { useLifeCycle } from "./useLifeCycle";

export function useGetMembers(): LedgerSyncMembers {
  const client = useKeyRingClient();
  const { handleError } = useLifeCycle();

  return useLedgerSyncMembers({ client, onError: handleError });
}
