import { useRef } from "react";
import { useSelector } from "LLD/hooks/redux";
import { hasSeenQ2TourSelector, hasSeenWalletV4TourSelector } from "~/renderer/reducers/settings";
import { useWalletFeaturesConfig } from "@features/platform-feature-flags";

/**
 * Returns whether Release Notes and Terms of Use modals should be mounted.
 * When a product tour is active, we defer those modals. We freeze "has seen tour"
 * at mount so closing the tour in the same session does not mount them.
 */
export function useShouldShowDeferredModals(): boolean {
  const hasSeenTour = useSelector(hasSeenWalletV4TourSelector);
  const hasSeenQ2Tour = useSelector(hasSeenQ2TourSelector);
  const { shouldDisplayTour, shouldDisplayQ2Tour } = useWalletFeaturesConfig("desktop");
  const hasSeenTourAtMountRef = useRef(hasSeenTour);
  const hasSeenQ2TourAtMountRef = useRef(hasSeenQ2Tour);

  const isAnyTourActiveAtMount =
    (shouldDisplayTour && !hasSeenTourAtMountRef.current) ||
    (shouldDisplayQ2Tour && !hasSeenQ2TourAtMountRef.current);

  return !isAnyTourActiveAtMount;
}
