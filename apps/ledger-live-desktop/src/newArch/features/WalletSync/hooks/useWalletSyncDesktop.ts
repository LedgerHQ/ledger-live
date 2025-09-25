import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { useCloudSyncSDK, useWatchWalletSync } from "@ledgerhq/live-wallet-sync-react";
import { resetTrustchainStore } from "@ledgerhq/ledger-key-ring-protocol/store";
import { walletSyncUpdate } from "@ledgerhq/live-wallet/store";
import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { cache as bridgeCache } from "~/renderer/bridge/cache";
import { useOnTrustchainRefreshNeeded } from "./useOnTrustchainRefreshNeeded";
import { useTrustchainSdk } from "./useTrustchainSdk";

const blacklistedTokenIds: string[] = [];

/**
 * Desktop wrapper: passes feature flag directly to avoid unnecessary object recreation
 */
export function useWalletSyncDesktop() {
  const feature = useFeature("lldWalletSync");
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
