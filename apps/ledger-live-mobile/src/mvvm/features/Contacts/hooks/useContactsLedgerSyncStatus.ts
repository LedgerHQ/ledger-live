import { selectIsLedgerSyncActive } from "@domain/entity-key-ring";
import type { ContactsLedgerSyncStatus } from "@features/flow-contacts-introduction";
import { useFeature } from "@features/platform-feature-flags";
import { useSelector } from "~/context/hooks";
import { useLedgerSyncStatus } from "LLM/features/WalletSync/hooks/useLedgerSyncStatus";

export function useContactsLedgerSyncStatus(): ContactsLedgerSyncStatus {
  const walletSyncFeature = useFeature("llmWalletSync");
  const isLedgerSyncActive = useSelector(selectIsLedgerSyncActive);
  const { isError, isLoading } = useLedgerSyncStatus();

  if (!walletSyncFeature?.enabled || isError) {
    return "unavailable";
  }

  if (isLoading) {
    return "checking";
  }

  return isLedgerSyncActive ? "ready" : "inactive";
}
