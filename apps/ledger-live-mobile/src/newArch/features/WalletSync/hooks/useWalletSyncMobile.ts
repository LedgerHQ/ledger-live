import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { useCloudSyncSDK, useWatchWalletSync } from "@ledgerhq/live-wallet-sync-react";
import { resetTrustchainStore } from "@ledgerhq/ledger-key-ring-protocol/store";
import { walletSyncUpdate } from "@ledgerhq/live-wallet/store";
import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { bridgeCache } from "~/bridge/cache";
import { useOnTrustchainRefreshNeeded } from "./useOnTrustchainRefreshNeeded";
import { useTrustchainSdk } from "./useTrustchainSdk";

const blacklistedTokenIds: string[] = [];

/**
 * Mobile wrapper: passes feature flag directly to avoid unnecessary object recreation
 */
export function useWalletSyncMobile() {
  const feature = useFeature("llmWalletSync");
  const dispatch = useDispatch();

  const resetLedgerSync = useCallback(() => {
    dispatch(resetTrustchainStore());
    dispatch(walletSyncUpdate(null, 0));
  }, [dispatch]);

  return useWatchWalletSync({
    blacklistedTokenIds,
    bridgeCache,
    feature,
    resetLedgerSync,
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
