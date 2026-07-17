import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { onboardingDateSelector } from "@ledgerhq/live-common/postOnboarding/reducer";
import { useFeature } from "@features/platform-feature-flags";
import {
  markBlockedByCompeting,
  retriesUpsellModalSelector,
  sessionSelector,
} from "@domain/entity-large-screen-upsell-modal";
import {
  LargeScreenUpsellModal,
  mapDevicesModelListToUpsellInputs,
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
  sharePersonalizedRecommendationsSelector,
} from "~/renderer/reducers/settings";
import { openURL } from "~/renderer/linking";
import {
  toLargeScreenUpsellDeviceModelAnalyticsValue,
  trackLargeScreenUpsellModalCtaClicked,
  trackLargeScreenUpsellModalDismissed,
  trackLargeScreenUpsellModalViewed,
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
  const isGenericAwarenessModalOpen = useSelector(selectIsGenericAwarenessModalOpen);

  const hasCompetingAppStartModal = !shouldShowDeferredModals || isGenericAwarenessModalOpen;

  useEffect(() => {
    if (hasCompetingAppStartModal && session === "ready") {
      dispatch(markBlockedByCompeting());
    }
  }, [dispatch, hasCompetingAppStartModal, session]);

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

  // session becomes "dismissed" on close — while visible it stays "ready" so Mount stays mounted.
  if (session !== "ready" || hasCompetingAppStartModal) {
    return null;
  }

  const { seenNanoModelIds, hasSeenTouchscreenDevice } =
    mapDevicesModelListToUpsellInputs(devicesModelList);

  return (
    <LargeScreenUpsellModal
      seenNanoModelIds={seenNanoModelIds}
      hasSeenTouchscreenDevice={hasSeenTouchscreenDevice}
      onboardingDate={onboardingDate}
      medium="desktop"
      theme={theme === "dark" ? "dark" : "light"}
      variant={personalizedRecommendationsEnabled ? "opted_in" : "opted_out"}
      t={t}
      openUrl={openURL}
      analytics={analytics}
    />
  );
}
