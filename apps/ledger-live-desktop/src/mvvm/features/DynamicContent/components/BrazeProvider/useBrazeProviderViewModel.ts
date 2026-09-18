import * as braze from "@braze/web-sdk";
import { type UserId, userIdSelector, isDummyUserId } from "@domain/entity-client-identity";
import { useFeature } from "@features/platform-feature-flags";
import { getEnv } from "@shared/env";
import {
  armBrazePendingRefreshTimeout,
  createBrazePendingRefresh,
  prepareBrazeIdentitySync,
  trackBrazeConsentTransition,
  type BrazePendingRefresh,
  type SyncedBrazeIdentity,
} from "@ledgerhq/live-common/braze/identityLifecycle";
import type { EligibilityContext } from "@ledgerhq/live-common/braze/localEligibility";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { getBrazeConfig } from "~/braze-setup";
import { applyBrazeConsentTransition } from "LLD/features/DynamicContent/utils/applyBrazeConsentTransition";
import { resolveDesktopBrazeUserId } from "LLD/features/DynamicContent/utils/brazeIdentity";
import { requireBrazeLifecycleMethod } from "LLD/features/DynamicContent/utils/brazeWebSdkLifecycle";
import { filterEligibleContentCards } from "LLD/features/DynamicContent/utils/filterEligibleContentCards";
import { useBrazeEligibilityContext } from "LLD/features/DynamicContent/hooks/useBrazeEligibilityContext";
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
const EMPTY_CONTENT_CARDS = {
  cards: [],
  lastUpdated: new Date(0),
  getUnviewedCardCount: () => 0,
} as braze.ContentCards;

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
  const isTrackedUserRef = useRef(isTrackedUser);
  isTrackedUserRef.current = isTrackedUser;
  const brazeOptOutIdentityCleanup = useFeature("brazeOptOutIdentityCleanup");
  const anonymousBrazeId = useRef(useSelector(anonymousBrazeIdSelector));
  const userId = useSelector(userIdSelector);
  const userIdRef = useRef(userId);
  userIdRef.current = userId;
  const brazeOptOutIdentityCleanupEnabled = brazeOptOutIdentityCleanup?.enabled ?? false;

  const contentCardsDismissedRef = useRef(contentCardsDismissed);
  contentCardsDismissedRef.current = contentCardsDismissed;
  const eligibilityContext = useBrazeEligibilityContext();
  const eligibilityContextRef = useRef(eligibilityContext);
  eligibilityContextRef.current = eligibilityContext;
  const lastFetchedCardsRef = useRef<braze.ContentCards | null>(null);

  const subscriptionIdRef = useRef<string | null>(null);
  const pendingRefreshRef = useRef<BrazePendingRefresh | null>(null);
  const subscriptionEpochRef = useRef(0);
  const lastSyncedIdentityRef = useRef<SyncedBrazeIdentity<UserId> | null>(null);
  const targetIdentityRef = useRef<SyncedBrazeIdentity<UserId> | null>(null);
  const pendingConsentTransitionRef = useRef<Promise<boolean> | null>(null);
  const retryCountRef = useRef(0);
  const identityUntrustedRef = useRef(false);
  const syncBrazeIdentityRef = useRef<() => void>(() => {});
  const sessionStartedRef = useRef(false);
  const lifecycleGenerationRef = useRef(0);
  const [sdkReady, setSdkReady] = useState(false);

  const publishEligibleCards = useCallback(
    (cards: braze.ContentCards, context: EligibilityContext) => {
      const dismissedCardIds = Object.keys(contentCardsDismissedRef.current ?? {});
      const { eligibleCards } = filterEligibleContentCards(
        cards.cards.filter(
          (card): card is braze.Card & { id: string } => typeof card.id === "string",
        ),
        context,
      );
      publishDesktopContentCards(
        dispatch,
        { ...cards, cards: eligibleCards } as braze.ContentCards,
        dismissedCardIds,
      );
    },
    [dispatch],
  );

  const handleContentCardsUpdated = useCallback(
    (cards: braze.ContentCards, subscriptionEpoch: number) => {
      if (subscriptionEpoch !== subscriptionEpochRef.current) return;

      const pendingRefresh = pendingRefreshRef.current;

      try {
        lastFetchedCardsRef.current = cards;
        publishEligibleCards(cards, eligibilityContextRef.current);
        pendingRefresh?.resolve();
      } catch (error) {
        pendingRefresh?.reject(error);
        console.warn("Error updating dynamic content", error);
      } finally {
        pendingRefreshRef.current = null;
      }
    },
    [publishEligibleCards],
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
    sessionStartedRef.current = false;
    if (subscriptionIdRef.current) {
      braze.removeSubscription(subscriptionIdRef.current);
      subscriptionIdRef.current = null;
    }
    pendingRefreshRef.current?.reject(new Error("Braze content cards refresh cancelled"));
    pendingRefreshRef.current = null;
    lastFetchedCardsRef.current = null;
  }, []);

  const ensureSessionStarted = useCallback(() => {
    if (sessionStartedRef.current) return;

    braze.automaticallyShowInAppMessages();
    braze.openSession();
    sessionStartedRef.current = true;
  }, []);

  const refreshContentCards = useCallback(() => {
    if (pendingRefreshRef.current) {
      return pendingRefreshRef.current.promise;
    }

    const pendingRefresh = createBrazePendingRefresh();
    pendingRefreshRef.current = armBrazePendingRefreshTimeout(pendingRefresh, pendingRefreshRef, {
      onTimeout: () => {
        subscriptionEpochRef.current += 1;
        if (subscriptionIdRef.current) {
          braze.removeSubscription(subscriptionIdRef.current);
          subscriptionIdRef.current = null;
        }
      },
    });

    ensureSubscription();

    try {
      braze.requestContentCardsRefresh();
    } catch (error) {
      pendingRefreshRef.current?.reject(error);
      pendingRefreshRef.current = null;
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
    const isDummyUser = isDummyUserId(userId);
    if (isDummyUser && (lastSyncedIdentityRef.current != null || sessionStartedRef.current)) {
      lifecycleGenerationRef.current += 1;
      prepareForIdentityTransition();
      publishDesktopContentCards(dispatch, EMPTY_CONTENT_CARDS, []);
    }
    const identitySync = prepareBrazeIdentitySync({
      currentIdentity,
      isDummyUser,
      userIdsMatch,
      lastSyncedIdentityRef,
      targetIdentityRef,
      pendingConsentTransitionRef,
      retryCountRef,
      identityUntrustedRef,
    });
    if (!identitySync) return;

    if (identitySync.isConsentTransition) {
      const generation = lifecycleGenerationRef.current;
      const shouldAbort = () =>
        lifecycleGenerationRef.current !== generation || isDummyUserId(userIdRef.current);
      const refreshAndReinitSession = async () => {
        if (shouldAbort()) return;
        ensureSessionStarted();
        await refreshContentCards();
      };

      trackBrazeConsentTransition({
        transition: applyBrazeConsentTransition(
          { isTrackedUser, userId },
          {
            prepareForIdentityTransition,
            refreshContentCards: refreshAndReinitSession,
            shouldAbort,
            enableSDK: async () => {
              if (shouldAbort()) return;
              await requireBrazeLifecycleMethod("enableSDK")();
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
        identityUntrustedRef,
        syncBrazeIdentity: () => syncBrazeIdentityRef.current(),
        isCurrent: () => !shouldAbort(),
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
    ensureSessionStarted();
    lastSyncedIdentityRef.current = currentIdentity;
    identityUntrustedRef.current = false;
    void refreshContentCards().catch(() => {});
  }, [
    brazeOptOutIdentityCleanupEnabled,
    devMode,
    ensureSessionStarted,
    isTrackedUser,
    prepareForIdentityTransition,
    dispatch,
    refreshContentCards,
    sdkReady,
    userId,
  ]);

  useEffect(() => {
    syncBrazeIdentityRef.current = syncBrazeIdentity;
  }, [syncBrazeIdentity]);

  useEffect(() => {
    const isPlaywright = !!getEnv("PLAYWRIGHT_RUN");
    const isInitialized = initializeBrazeSdk(devMode, isTrackedUserRef.current);

    if (!isInitialized) {
      console.warn("Failed to initialize Braze SDK");
      return;
    }

    if (isPlaywright) {
      return;
    }

    setSdkReady(true);

    return () => {
      lifecycleGenerationRef.current += 1;
      if (subscriptionIdRef.current) {
        braze.removeSubscription(subscriptionIdRef.current);
        subscriptionIdRef.current = null;
      }
      pendingRefreshRef.current?.resolve();
      pendingRefreshRef.current = null;
      lastSyncedIdentityRef.current = null;
      identityUntrustedRef.current = false;
      sessionStartedRef.current = false;
      setSdkReady(false);
    };
  }, [devMode]);

  useEffect(() => {
    syncBrazeIdentity();
  }, [syncBrazeIdentity]);

  useEffect(() => {
    const cards = lastFetchedCardsRef.current;
    if (!cards) return;
    publishEligibleCards(cards, eligibilityContext);
  }, [eligibilityContext, publishEligibleCards]);

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
