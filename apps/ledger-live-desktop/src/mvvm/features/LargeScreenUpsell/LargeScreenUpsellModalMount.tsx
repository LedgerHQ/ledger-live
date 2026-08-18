import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { onboardingDateSelector } from "@ledgerhq/live-common/postOnboarding/reducer";
import { useFeature, useWalletFeaturesConfig } from "@features/platform-feature-flags";
import {
  LargeScreenUpsellModal,
  mapDevicesModelListToUpsellInputs,
  markBlockedByCompeting,
  retriesUpsellModalSelector,
  sessionSelector,
  useLargeScreenUpsellDecision,
  type LargeScreenUpsellDismissMethod,
  type LargeScreenUpsellModalAnalyticsPorts,
  type LargeScreenUpsellModalViewedContext,
  type NanoDeviceModelId,
} from "@features/flow-large-screen-upsell";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { themeSelector } from "~/renderer/actions/general";
import { useShouldShowDeferredModals } from "~/renderer/hooks/useShouldShowDeferredModals";
import { selectIsGenericAwarenessModalOpen } from "LLD/features/GenericAwarenessModal/genericAwarenessModalDialog";
import {
  devicesModelListSelector,
  hasSeenQ2TourSelector,
  hasSeenWalletV4TourSelector,
  sharePersonalizedRecommendationsSelector,
} from "~/renderer/reducers/settings";
import { openURL } from "~/renderer/linking";
import {
  toLargeScreenUpsellDeviceModelAnalyticsValue,
  trackLargeScreenUpsellModalBlockedByCompeting,
  trackLargeScreenUpsellModalCtaClicked,
  trackLargeScreenUpsellModalDismissed,
  trackLargeScreenUpsellModalViewed,
  type LargeScreenUpsellBlockedCompetitor,
  type LargeScreenUpsellSharedAnalyticsProps,
} from "./analytics";

function buildSharedAnalyticsProps({
  deviceModelId,
  personalizedRecommendationsEnabled,
  retries,
  killThreshold,
}: {
  deviceModelId: NanoDeviceModelId;
  personalizedRecommendationsEnabled: boolean;
  retries: number;
  killThreshold: number | undefined;
}): LargeScreenUpsellSharedAnalyticsProps {
  return {
    deviceModel: toLargeScreenUpsellDeviceModelAnalyticsValue(deviceModelId),
    personalRecoOptIn: personalizedRecommendationsEnabled,
    offerType: personalizedRecommendationsEnabled ? "discount" : "none",
    platform: "lwd",
    retriesUpsellModal: retries,
    throttled: killThreshold !== undefined && retries >= killThreshold,
  };
}

function resolveCompetingAppStartModal({
  isWalletV4TourCompeting,
  isQ2TourCompeting,
  isGenericAwarenessModalOpen,
}: {
  isWalletV4TourCompeting: boolean;
  isQ2TourCompeting: boolean;
  isGenericAwarenessModalOpen: boolean;
}): LargeScreenUpsellBlockedCompetitor | null {
  if (isWalletV4TourCompeting) {
    return "wallet_v4_tour";
  }
  if (isQ2TourCompeting) {
    return "q2_tour";
  }
  if (isGenericAwarenessModalOpen) {
    return "generic_awareness";
  }
  return null;
}

export function LargeScreenUpsellModalMount() {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const devicesModelList = useSelector(devicesModelListSelector);
  const onboardingDate = useSelector(onboardingDateSelector);
  const theme = useSelector(themeSelector);
  const personalizedRecommendationsEnabled = useSelector(sharePersonalizedRecommendationsSelector);
  const retries = useSelector(retriesUpsellModalSelector);
  const session = useSelector(sessionSelector);
  const feature = useFeature("largeScreenUpsell");
  const shouldShowDeferredModals = useShouldShowDeferredModals();
  const hasSeenWalletV4Tour = useSelector(hasSeenWalletV4TourSelector);
  const hasSeenQ2Tour = useSelector(hasSeenQ2TourSelector);
  const { shouldDisplayTour, shouldDisplayQ2Tour } = useWalletFeaturesConfig("desktop");
  const isGenericAwarenessModalOpen = useSelector(selectIsGenericAwarenessModalOpen);

  const variant = personalizedRecommendationsEnabled ? "opted_in" : "opted_out";
  const { seenNanoModelIds, hasSeenTouchscreenDevice } = useMemo(
    () => mapDevicesModelListToUpsellInputs(devicesModelList),
    [devicesModelList],
  );
  const decision = useLargeScreenUpsellDecision({
    seenNanoModelIds,
    hasSeenTouchscreenDevice,
    onboardingDate,
    variant,
  });

  // Gate with the same deferred-tour freeze as Terms/Release Notes.
  const hasCompetingAppStartModal = !shouldShowDeferredModals || isGenericAwarenessModalOpen;

  // Competitor identity is only for analytics (`modal_blocked`).
  const competingModal = resolveCompetingAppStartModal({
    isWalletV4TourCompeting: shouldDisplayTour && !hasSeenWalletV4Tour,
    isQ2TourCompeting: shouldDisplayQ2Tour && !hasSeenQ2Tour,
    isGenericAwarenessModalOpen,
  });

  const hasTrackedBlockRef = useRef(false);

  useEffect(() => {
    if (!hasCompetingAppStartModal || session !== "ready" || !decision.shouldShow) {
      return;
    }
    if (!hasTrackedBlockRef.current && competingModal !== null) {
      hasTrackedBlockRef.current = true;
      trackLargeScreenUpsellModalBlockedByCompeting(competingModal);
    }
    dispatch(markBlockedByCompeting());
  }, [competingModal, decision.shouldShow, dispatch, hasCompetingAppStartModal, session]);

  const currentModalAnalyticsPropsRef = useRef<LargeScreenUpsellSharedAnalyticsProps | null>(null);

  const killThreshold = feature?.params?.modal?.killThreshold;

  const getAnalyticsPropsForDevice = useCallback(
    (deviceModelId: NanoDeviceModelId) =>
      buildSharedAnalyticsProps({
        deviceModelId,
        personalizedRecommendationsEnabled,
        retries,
        killThreshold,
      }),
    [personalizedRecommendationsEnabled, retries, killThreshold],
  );

  const analytics: LargeScreenUpsellModalAnalyticsPorts = useMemo(
    () => ({
      onModalViewed: ({ deviceModelId }: LargeScreenUpsellModalViewedContext) => {
        const sharedProps = getAnalyticsPropsForDevice(deviceModelId);
        currentModalAnalyticsPropsRef.current = sharedProps;
        trackLargeScreenUpsellModalViewed(sharedProps);
      },
      onCtaClicked: () => {
        if (currentModalAnalyticsPropsRef.current) {
          trackLargeScreenUpsellModalCtaClicked(currentModalAnalyticsPropsRef.current);
        }
        currentModalAnalyticsPropsRef.current = null;
      },
      onDismissed: (dismissMethod: LargeScreenUpsellDismissMethod) => {
        if (currentModalAnalyticsPropsRef.current) {
          trackLargeScreenUpsellModalDismissed(
            dismissMethod,
            currentModalAnalyticsPropsRef.current,
          );
        }
        currentModalAnalyticsPropsRef.current = null;
      },
    }),
    [getAnalyticsPropsForDevice],
  );

  // session becomes "dismissed" / "blockedByCompeting" — while visible it stays "ready".
  // Competing modals gate `isAllowedToDisplay` so a visible upsell can roll back its
  // impression before the session flips to blockedByCompeting.
  if (session !== "ready") {
    return null;
  }

  return (
    <LargeScreenUpsellModal
      seenNanoModelIds={seenNanoModelIds}
      hasSeenTouchscreenDevice={hasSeenTouchscreenDevice}
      onboardingDate={onboardingDate}
      medium="desktop"
      theme={theme === "dark" ? "dark" : "light"}
      variant={variant}
      t={t}
      openUrl={openURL}
      analytics={analytics}
      isAllowedToDisplay={!hasCompetingAppStartModal}
    />
  );
}
