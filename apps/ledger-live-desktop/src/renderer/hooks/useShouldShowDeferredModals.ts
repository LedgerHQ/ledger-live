import { useRef } from "react";
import { useSelector } from "LLD/hooks/redux";
import { hasSeenWalletV4TourSelector } from "~/renderer/reducers/settings";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/walletFeaturesConfig/useWalletFeaturesConfig";

/**
 * Returns whether Release Notes and Terms of Use modals should be mounted.
 * When the Wallet V4 tour is active, we defer those modals. We freeze "has seen tour"
 * at mount so closing the tour in the same session does not mount them.
 */
export function useShouldShowDeferredModals(): boolean {
  const hasSeenTour = useSelector(hasSeenWalletV4TourSelector);
  const { shouldDisplayTour } = useWalletFeaturesConfig("desktop");
  const hasSeenTourAtMountRef = useRef(hasSeenTour);
  return !shouldDisplayTour || hasSeenTourAtMountRef.current;
}
