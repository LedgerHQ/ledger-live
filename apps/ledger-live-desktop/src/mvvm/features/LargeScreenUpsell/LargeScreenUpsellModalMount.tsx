import React, { useRef } from "react";
import { useTranslation } from "react-i18next";
import { onboardingDateSelector } from "@ledgerhq/live-common/postOnboarding/reducer";
import {
  LargeScreenUpsellModal,
  mapDevicesModelListToUpsellInputs,
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

export function LargeScreenUpsellModalMount() {
  const { t } = useTranslation();
  const devicesModelList = useSelector(devicesModelListSelector);
  const onboardingDate = useSelector(onboardingDateSelector);
  const theme = useSelector(themeSelector);
  const personalizedRecommendationsEnabled = useSelector(sharePersonalizedRecommendationsSelector);
  const shouldShowDeferredModals = useShouldShowDeferredModals();
  const isGenericAwarenessModalOpen = useSelector(selectIsGenericAwarenessModalOpen);

  const hasCompetingAppStartModal = !shouldShowDeferredModals || isGenericAwarenessModalOpen;
  const hasSeenCompetingAppStartModalRef = useRef(hasCompetingAppStartModal);
  if (hasCompetingAppStartModal) {
    hasSeenCompetingAppStartModalRef.current = true;
  }

  if (hasSeenCompetingAppStartModalRef.current) {
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
    />
  );
}
