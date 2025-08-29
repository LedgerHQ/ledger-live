import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { useCloudSyncSDK, useWatchWalletSync } from "@ledgerhq/live-wallet-sync-react";
import { cache as bridgeCache } from "~/renderer/bridge/cache";
import { useOnTrustchainRefreshNeeded } from "./useOnTrustchainRefreshNeeded";
import { useTrustchainSdk } from "./useTrustchainSdk";

const blacklistedTokenIds: string[] = [];

/**
 * Desktop wrapper: passes feature flag directly to avoid unnecessary object recreation
 */
export function useWalletSyncDesktop() {
  const feature = useFeature("lldWalletSync");

  return useWatchWalletSync({
    blacklistedTokenIds,
    bridgeCache,
    feature,
    useOnTrustchainRefreshNeeded,
    useTrustchainSdk,
  });
}

/**
 * Desktop CloudSyncSDK wrapper
 */
export function useCloudSyncSDKDesktop() {
  const feature = useFeature("lldWalletSync");

  return useCloudSyncSDK({
    blacklistedTokenIds,
    bridgeCache,
    feature,
    useTrustchainSdk,
  });
}
