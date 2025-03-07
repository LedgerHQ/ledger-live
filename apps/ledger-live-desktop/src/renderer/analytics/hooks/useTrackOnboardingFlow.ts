import { useEffect } from "react";
import { Device } from "@ledgerhq/types-devices";
import { SeedPathStatus } from "~/renderer/components/SyncOnboarding/Manual/SeedStep";
import { track } from "../segment";
import { CONNECTION_TYPES, HOOKS_TRACKING_LOCATIONS } from "./variables";

export type UseTrackOnboardingFlow = {
  location: HOOKS_TRACKING_LOCATIONS.onboardingFlow | undefined;
  device: Device;
  isTrackingEnabled: boolean;
  seedPathStatus: SeedPathStatus;
};

/**
 * a custom hook to track events in the Receive modal.
 * tracks user interactions with the Receive modal based on state changes and errors.
 *
 * @param location - current location in the app (expected "Onboarding flow" from HOOKS_TRACKING_LOCATIONS enum).
 * @param device - the connected device information.
 * @param isTrackingEnabled - flag indicating if tracking is enabled.
 * @param seedPathStatus - the current seed path status.
 */
export const useTrackOnboardingFlow = ({
  location,
  device,
  isTrackingEnabled,
  seedPathStatus,
}: UseTrackOnboardingFlow) => {
  useEffect(() => {
    if (location !== HOOKS_TRACKING_LOCATIONS.onboardingFlow) return;

    const defaultPayload = {
      deviceType: device?.modelId,
      connectionType: device?.wired ? CONNECTION_TYPES.USB : CONNECTION_TYPES.BLE,
      platform: "LLD",
      page: "Onboarding",
    };

    if (seedPathStatus === "restore_seed") {
      // user selects "Restore from seed" option
      track("Restore with SRP", defaultPayload);
    } else if (seedPathStatus === "recover_seed") {
      // user selects "ledger recover" option
      track("Restore with Recover", defaultPayload);
    }
  }, [location, isTrackingEnabled, device, seedPathStatus]);
};
