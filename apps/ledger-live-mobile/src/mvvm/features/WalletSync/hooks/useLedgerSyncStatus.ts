import {
  useLedgerSyncBackends,
  useLedgerSyncServiceStatus,
  type LedgerSyncServiceStatus,
} from "@features/platform-ledger-sync";
import { useFeature } from "@features/platform-feature-flags";
import { useKeyRingClient } from "./useKeyRingClient";

export function useLedgerSyncStatus(): LedgerSyncServiceStatus {
  const featureWalletSync = useFeature("llmWalletSync");
  const { cloudSyncApiBaseUrl } = useLedgerSyncBackends();

  return useLedgerSyncServiceStatus({
    client: useKeyRingClient(),
    cloudSyncApiBaseUrl,
    enabled: featureWalletSync?.enabled === true,
  });
}
