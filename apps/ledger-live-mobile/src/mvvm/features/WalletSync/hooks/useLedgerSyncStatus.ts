import {
  useLedgerSyncServiceStatus,
  type LedgerSyncServiceStatus,
} from "@features/flow-ledger-sync";
import { useFeature } from "@features/platform-feature-flags";
import getWalletSyncEnvironmentParams from "@ledgerhq/live-common/walletSync/getEnvironmentParams";

export function useLedgerSyncStatus(): LedgerSyncServiceStatus {
  const featureWalletSync = useFeature("llmWalletSync");
  const { trustchainApiBaseUrl, cloudSyncApiBaseUrl } = getWalletSyncEnvironmentParams(
    featureWalletSync?.params?.environment,
  );

  return useLedgerSyncServiceStatus({
    keyRingApiBaseUrl: trustchainApiBaseUrl,
    cloudSyncApiBaseUrl,
    enabled: featureWalletSync?.enabled === true,
  });
}
