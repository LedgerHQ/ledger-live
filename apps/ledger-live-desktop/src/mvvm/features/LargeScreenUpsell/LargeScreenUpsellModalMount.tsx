import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { onboardingDateSelector } from "@ledgerhq/live-common/postOnboarding/reducer";
import { useFeature } from "@features/platform-feature-flags";
import { retriesUpsellModalSelector } from "@domain/entity-large-screen-upsell-modal";
import {
  LargeScreenUpsellModal,
  mapDevicesModelListToUpsellInputs,
  type LargeScreenUpsellDismissMethod,
  type LargeScreenUpsellModalAnalyticsPorts,
  type LargeScreenUpsellModalViewedContext,
  type NanoDeviceModelId,
} from "@features/flow-large-screen-upsell";
import { useSelector } from "LLD/hooks/redux";
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
  const { t } = useTranslation();
  const devicesModelList = useSelector(devicesModelListSelector);
  const onboardingDate = useSelector(onboardingDateSelector);
  const theme = useSelector(themeSelector);
  const personalizedRecommendationsEnabled = useSelector(sharePersonalizedRecommendationsSelector);
  const retries = useSelector(retriesUpsellModalSelector);
  const feature = useFeature("largeScreenUpsell");
  const shouldShowDeferredModals = useShouldShowDeferredModals();
  const isGenericAwarenessModalOpen = useSelector(selectIsGenericAwarenessModalOpen);

  const hasCompetingAppStartModal = !shouldShowDeferredModals || isGenericAwarenessModalOpen;
  const hasSeenCompetingAppStartModalRef = useRef(false);

  useEffect(() => {
    if (hasCompetingAppStartModal) {
      hasSeenCompetingAppStartModalRef.current = true;
    }
  }, [hasCompetingAppStartModal]);

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

  if (hasCompetingAppStartModal || hasSeenCompetingAppStartModalRef.current) {
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
