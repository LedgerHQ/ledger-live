import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { useCloudSyncSDK, useWatchWalletSync } from "@ledgerhq/live-wallet-sync-react";
import { bridgeCache } from "~/bridge/cache";
import { useOnTrustchainRefreshNeeded } from "./useOnTrustchainRefreshNeeded";
import { useTrustchainSdk } from "./useTrustchainSdk";

const blacklistedTokenIds: string[] = [];

/**
 * Mobile wrapper: passes feature flag directly to avoid unnecessary object recreation
 */
export function useWalletSyncMobile() {
  const feature = useFeature("llmWalletSync");

  return useWatchWalletSync({
    blacklistedTokenIds,
    bridgeCache,
    feature,
    useOnTrustchainRefreshNeeded,
    useTrustchainSdk,
  });
}

/**
 * Mobile CloudSyncSDK wrapper
 */
export function useCloudSyncSDKMobile() {
  const feature = useFeature("llmWalletSync");

  return useCloudSyncSDK({
    blacklistedTokenIds,
    bridgeCache,
    feature,
    useTrustchainSdk,
  });
}
