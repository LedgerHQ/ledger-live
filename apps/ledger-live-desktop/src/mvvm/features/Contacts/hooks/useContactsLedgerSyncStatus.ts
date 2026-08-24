import { trustchainSelector } from "@ledgerhq/ledger-key-ring-protocol/store";
import type { ContactsLedgerSyncStatus } from "@features/flow-contacts-introduction";
import { useFeature } from "@features/platform-feature-flags";
import { useSelector } from "LLD/hooks/redux";
import { useWalletSyncUserState } from "LLD/features/WalletSync/components/WalletSyncContext";

export function useContactsLedgerSyncStatus(): ContactsLedgerSyncStatus {
  const walletSyncFeature = useFeature("lldWalletSync");
  const trustchain = useSelector(trustchainSelector);
  const { visualPending, walletSyncError } = useWalletSyncUserState();

  if (!walletSyncFeature?.enabled || walletSyncError) {
    return "unavailable";
  }

  if (visualPending) {
    return "checking";
  }

  return trustchain?.rootId ? "ready" : "inactive";
}
