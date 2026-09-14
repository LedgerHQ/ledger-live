import { useRef } from "react";
import { useSelector } from "LLD/hooks/redux";
import { hasSeenQ2TourSelector, hasSeenWalletV4TourSelector } from "~/renderer/reducers/settings";
import { useFeature, useWalletFeaturesConfig } from "@features/platform-feature-flags";
import { isQ2ReleaseTourEnabled } from "LLD/features/Q2Tour/releaseTourGate";

/**
 * Returns whether Release Notes and Terms of Use modals should be mounted.
 * When a product tour is active, we defer those modals. We freeze "has seen tour"
 * at mount so closing the tour in the same session does not mount them.
 */
export function useShouldShowDeferredModals(): boolean {
  const hasSeenTour = useSelector(hasSeenWalletV4TourSelector);
  const hasSeenQ2Tour = useSelector(hasSeenQ2TourSelector);
  const { shouldDisplayTour } = useWalletFeaturesConfig("desktop");
  const isQ2TourEnabled = isQ2ReleaseTourEnabled(useFeature("releaseTour"));
  const hasSeenTourAtMountRef = useRef(hasSeenTour);
  const hasSeenQ2TourAtMountRef = useRef(hasSeenQ2Tour);

  const isAnyTourActiveAtMount =
    (shouldDisplayTour && !hasSeenTourAtMountRef.current) ||
    (isQ2TourEnabled && !hasSeenQ2TourAtMountRef.current);

  return !isAnyTourActiveAtMount;
}
