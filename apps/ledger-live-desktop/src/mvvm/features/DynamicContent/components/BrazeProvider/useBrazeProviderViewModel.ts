import * as braze from "@braze/web-sdk";
import { type UserId, userIdSelector, isDummyUserId } from "@domain/entity-client-identity";
import { useFeature } from "@features/platform-feature-flags";
import { getEnv } from "@shared/env";
import {
  createBrazePendingRefresh,
  prepareBrazeIdentitySync,
  trackBrazeConsentTransition,
  type BrazePendingRefresh,
  type SyncedBrazeIdentity,
} from "@ledgerhq/live-common/braze/identityLifecycle";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { getBrazeConfig } from "~/braze-setup";
import { applyBrazeConsentTransition } from "~/renderer/braze/applyBrazeConsentTransition";
import { resolveDesktopBrazeUserId } from "~/renderer/braze/brazeIdentity";
import { requireBrazeLifecycleMethod } from "~/renderer/braze/brazeWebSdkLifecycle";
import { publishDesktopContentCards } from "~/renderer/hooks/useBraze";
import {
  clearDismissedContentCards,
  purgeExpiredAnonymousUserNotifications,
} from "~/renderer/actions/settings";
import {
  anonymousBrazeIdSelector,
  developerModeSelector,
  dismissedContentCardsSelector,
  trackingEnabledSelector,
} from "~/renderer/reducers/settings";

const userIdsMatch = (left: UserId, right: UserId): boolean => left.equals(right);

const initializeBrazeSdk = (devMode: boolean, isTrackedUser: boolean): boolean => {
  const brazeConfig = getBrazeConfig();
  return braze.initialize(brazeConfig.apiKey, {
    baseUrl: brazeConfig.endpoint,
    allowUserSuppliedJavascript: false,
    enableLogging: __DEV__,
    sessionTimeoutInSeconds: devMode ? 1 : 1800,
    appVersion: isTrackedUser ? __APP_VERSION__ : undefined,
  });
};

export function useBrazeProviderViewModel() {
  const dispatch = useDispatch();
  const devMode = useSelector(developerModeSelector);
  const contentCardsDismissed = useSelector(dismissedContentCardsSelector);
  const isTrackedUser = useSelector(trackingEnabledSelector);
  const initialIsTrackedUserRef = useRef(isTrackedUser);
  const brazeOptOutIdentityCleanup = useFeature("brazeOptOutIdentityCleanup");
  const anonymousBrazeId = useRef(useSelector(anonymousBrazeIdSelector));
  const userId = useSelector(userIdSelector);
  const brazeOptOutIdentityCleanupEnabled = brazeOptOutIdentityCleanup?.enabled ?? false;

  const contentCardsDismissedRef = useRef(contentCardsDismissed);
  contentCardsDismissedRef.current = contentCardsDismissed;

  const subscriptionIdRef = useRef<string | null>(null);
  const pendingRefreshRef = useRef<BrazePendingRefresh | null>(null);
  const subscriptionEpochRef = useRef(0);
  const lastSyncedIdentityRef = useRef<SyncedBrazeIdentity<UserId> | null>(null);
  const targetIdentityRef = useRef<SyncedBrazeIdentity<UserId> | null>(null);
  const pendingConsentTransitionRef = useRef<Promise<boolean> | null>(null);
  const retryCountRef = useRef(0);
  const syncBrazeIdentityRef = useRef<() => void>(() => {});
  const [sdkReady, setSdkReady] = useState(false);

  const handleContentCardsUpdated = useCallback(
    (cards: braze.ContentCards, subscriptionEpoch: number) => {
      if (subscriptionEpoch !== subscriptionEpochRef.current) return;

      const pendingRefresh = pendingRefreshRef.current;
      const dismissedCardIds = Object.keys(contentCardsDismissedRef.current ?? {});

      try {
        publishDesktopContentCards(dispatch, cards, dismissedCardIds);
        pendingRefresh?.resolve();
      } catch (error) {
        pendingRefresh?.reject(error);
        console.warn("Error updating dynamic content", error);
      } finally {
        pendingRefreshRef.current = null;
      }
    },
    [dispatch],
  );

  const ensureSubscription = useCallback(() => {
    if (subscriptionIdRef.current) return;

    const subscriptionEpoch = subscriptionEpochRef.current;
    subscriptionIdRef.current =
      braze.subscribeToContentCardsUpdates(cards =>
        handleContentCardsUpdated(cards, subscriptionEpoch),
      ) ?? null;
  }, [handleContentCardsUpdated]);

  const prepareForIdentityTransition = useCallback(() => {
    subscriptionEpochRef.current += 1;
    if (subscriptionIdRef.current) {
      braze.removeSubscription(subscriptionIdRef.current);
      subscriptionIdRef.current = null;
    }
    pendingRefreshRef.current?.resolve();
    pendingRefreshRef.current = null;
  }, []);

  const refreshContentCards = useCallback(() => {
    if (pendingRefreshRef.current) {
      return pendingRefreshRef.current.promise;
    }

    const pendingRefresh = createBrazePendingRefresh();
    pendingRefreshRef.current = pendingRefresh;

    ensureSubscription();

    try {
      braze.requestContentCardsRefresh();
    } catch (error) {
      pendingRefreshRef.current = null;
      pendingRefresh.reject(error);
    }

    return pendingRefresh.promise;
  }, [ensureSubscription]);

  const syncBrazeIdentity = useCallback(() => {
    if (!sdkReady) {
      return;
    }

    const currentIdentity: SyncedBrazeIdentity<UserId> = {
      userId,
      isTrackedUser,
      brazeOptOutIdentityCleanup: brazeOptOutIdentityCleanupEnabled,
    };
    const identitySync = prepareBrazeIdentitySync({
      currentIdentity,
      isDummyUser: isDummyUserId(userId),
      userIdsMatch,
      lastSyncedIdentityRef,
      targetIdentityRef,
      pendingConsentTransitionRef,
      retryCountRef,
    });
    if (!identitySync) return;

    if (identitySync.isConsentTransition) {
      trackBrazeConsentTransition({
        transition: applyBrazeConsentTransition(
          { isTrackedUser, userId },
          {
            prepareForIdentityTransition,
            refreshContentCards,
            enableSDK: () => {
              requireBrazeLifecycleMethod("enableSDK")();
              const isInitialized = initializeBrazeSdk(devMode, isTrackedUser);
              if (!isInitialized) {
                throw new Error("Failed to initialize Braze SDK");
              }
            },
          },
        ),
        currentIdentity,
        userIdsMatch,
        lastSyncedIdentityRef,
        targetIdentityRef,
        pendingConsentTransitionRef,
        retryCountRef,
        syncBrazeIdentity: () => syncBrazeIdentityRef.current(),
        onIdentitySynced: () => {
          braze.automaticallyShowInAppMessages();
          braze.openSession();
        },
      });
      return;
    }

    const changeUserId = resolveDesktopBrazeUserId({
      isTrackedUser,
      userId,
      anonymousBrazeId: anonymousBrazeId.current,
      brazeOptOutIdentityCleanup: brazeOptOutIdentityCleanupEnabled,
    });
    if (changeUserId) {
      braze.changeUser(changeUserId);
    }
    lastSyncedIdentityRef.current = currentIdentity;
    void refreshContentCards().catch(() => {});
  }, [
    brazeOptOutIdentityCleanupEnabled,
    devMode,
    isTrackedUser,
    prepareForIdentityTransition,
    refreshContentCards,
    sdkReady,
    userId,
  ]);

  useEffect(() => {
    syncBrazeIdentityRef.current = syncBrazeIdentity;
  }, [syncBrazeIdentity]);

  useEffect(() => {
    const isPlaywright = !!getEnv("PLAYWRIGHT_RUN");
    const isInitialized = initializeBrazeSdk(devMode, initialIsTrackedUserRef.current);

    if (!isInitialized) {
      console.warn("Failed to initialize Braze SDK");
      return;
    }

    if (isPlaywright) {
      return;
    }

    braze.automaticallyShowInAppMessages();
    braze.openSession();
    setSdkReady(true);

    return () => {
      if (subscriptionIdRef.current) {
        braze.removeSubscription(subscriptionIdRef.current);
        subscriptionIdRef.current = null;
      }
      pendingRefreshRef.current?.resolve();
      pendingRefreshRef.current = null;
      setSdkReady(false);
    };
  }, [devMode]);

  useEffect(() => {
    syncBrazeIdentity();
  }, [syncBrazeIdentity]);

  useEffect(() => {
    dispatch(clearDismissedContentCards({ now: new Date() }));
  }, [dispatch]);

  useEffect(() => {
    if (!isTrackedUser) {
      dispatch(purgeExpiredAnonymousUserNotifications({ now: new Date() }));
    }
  }, [dispatch, isTrackedUser]);

  return { prepareForIdentityTransition, refreshContentCards };
}
