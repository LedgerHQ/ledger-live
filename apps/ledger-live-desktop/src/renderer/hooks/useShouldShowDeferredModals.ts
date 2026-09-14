import { useRef } from "react";
import { useSelector } from "LLD/hooks/redux";
import { hasSeenQ2TourSelector } from "~/renderer/reducers/settings";
import { useFeature } from "@features/platform-feature-flags";
import { isQ2ReleaseTourEnabled } from "LLD/features/Q2Tour/releaseTourGate";

/**
 * Returns whether Release Notes and Terms of Use modals should be mounted.
 * When a product tour is active, we defer those modals. We freeze "has seen tour"
 * at mount so closing the tour in the same session does not mount them.
 */
export function useShouldShowDeferredModals(): boolean {
  const hasSeenQ2Tour = useSelector(hasSeenQ2TourSelector);
  const isQ2TourEnabled = isQ2ReleaseTourEnabled(useFeature("releaseTour"));
  const hasSeenQ2TourAtMountRef = useRef(hasSeenQ2Tour);

  const isAnyTourActiveAtMount = isQ2TourEnabled && !hasSeenQ2TourAtMountRef.current;

  return !isAnyTourActiveAtMount;
}
