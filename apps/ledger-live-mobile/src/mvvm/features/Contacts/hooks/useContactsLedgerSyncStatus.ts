import { trustchainSelector } from "@ledgerhq/ledger-key-ring-protocol/store";
import type { ContactsLedgerSyncStatus } from "@features/flow-contacts-introduction";
import { useFeature } from "@features/platform-feature-flags";
import { useSelector } from "~/context/hooks";
import { useLedgerSyncStatus } from "LLM/features/WalletSync/hooks/useLedgerSyncStatus";

export function useContactsLedgerSyncStatus(): ContactsLedgerSyncStatus {
  const walletSyncFeature = useFeature("llmWalletSync");
  const trustchain = useSelector(trustchainSelector);
  const { isError, isLoading } = useLedgerSyncStatus();

  if (!walletSyncFeature?.enabled || isError) {
    return "unavailable";
  }

  if (isLoading) {
    return "checking";
  }

  return trustchain?.rootId ? "ready" : "inactive";
}
