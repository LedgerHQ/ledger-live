import {
  useLedgerSyncBackends,
  useLedgerSyncServiceStatus,
  type LedgerSyncServiceStatus,
} from "@features/flow-ledger-sync";
import { useFeature } from "@features/platform-feature-flags";

export function useLedgerSyncStatus(): LedgerSyncServiceStatus {
  const featureWalletSync = useFeature("llmWalletSync");
  const { keyRingApiBaseUrl, cloudSyncApiBaseUrl } = useLedgerSyncBackends();

  return useLedgerSyncServiceStatus({
    keyRingApiBaseUrl,
    cloudSyncApiBaseUrl,
    enabled: featureWalletSync?.enabled === true,
  });
}
