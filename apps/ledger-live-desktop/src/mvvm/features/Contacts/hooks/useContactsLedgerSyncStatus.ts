import type { ContactsLedgerSyncStatus } from "@features/flow-contacts-introduction";
import { useFeature } from "@features/platform-feature-flags";
import { useLedgerSyncInfo } from "LLD/features/WalletSync/hooks/useLedgerSyncInfo";

export function useContactsLedgerSyncStatus(): ContactsLedgerSyncStatus {
  const walletSyncFeature = useFeature("lldWalletSync");
  const {
    statusQuery: { isError, isLoading },
    treeId,
  } = useLedgerSyncInfo();

  if (!walletSyncFeature?.enabled || isError) {
    return "unavailable";
  }

  if (isLoading) {
    return "checking";
  }

  return treeId ? "ready" : "inactive";
}
