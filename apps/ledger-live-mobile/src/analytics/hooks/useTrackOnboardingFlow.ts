import { useEffect } from "react";
import { CONNECTION_TYPES, HOOKS_TRACKING_LOCATIONS } from "./variables";
import { track } from "../segment";
import { Device } from "@ledgerhq/types-devices";
import { SeedPathStatus } from "~/screens/SyncOnboarding/SyncOnboardingCompanion";

export type UseTrackOnboardingFlow = {
  location: HOOKS_TRACKING_LOCATIONS.onboardingFlow | undefined;
  device: Device;
  seedPathStatus?: SeedPathStatus;
  isPaired?: boolean;
  isCLSLoading?: boolean;
};

/**
 * a custom hook to track events in the onboarding flow.
 * tracks user interactions within the onboarding flow based on state changes and errors.
 *
 * @param location - current location in the app (expected "Swap Flow" from HOOKS_TRACKING_LOCATIONS enum).
 * @param device - the connected device information.
 * @param seedPathStatus - optional - the current step viewed in the onboarding flow.
 * @param isPaired - optional - flag indicating if the device is paired.
 * @param isCLSLoading - optional - flag indicating if the device is loading.
 */
export const useTrackOnboardingFlow = ({
  location,
  device,
  seedPathStatus,
  isPaired,
  isCLSLoading,
}: UseTrackOnboardingFlow) => {
  useEffect(() => {
    if (location !== HOOKS_TRACKING_LOCATIONS.onboardingFlow) return;
    if (!device?.modelId || typeof device.wired !== "boolean") return;

    const defaultPayload = {
      deviceType: device?.modelId,
      connectionType: device?.wired ? CONNECTION_TYPES.USB : CONNECTION_TYPES.BLE,
      platform: "LLM",
      page: "Onboarding",
    };

    if (seedPathStatus) {
      const seedPathActions: { [key: string]: () => void } = {
        new_seed: () => {
          // user is setting up a new seed
          track("Set-up as a new device", defaultPayload);
        },
        restore_seed: () => {
          // user picked restore with recovery phrase
          track("Restore with Secret Recovery Phrase", defaultPayload);
        },
        recover_seed: () => {
          // user picked restore with recover
          track("Restore with Recover", defaultPayload);
        },
        choice_restore_direct_or_recover: () => {
          // user selected restore
          track("User choose Restore", defaultPayload);
        },
      };
      seedPathActions[seedPathStatus]?.();
    }

    if (isPaired) {
      // parinmg with device completed
      track("Pairing completed", defaultPayload);
    }

    if (isCLSLoading) {
      // user chose CLS within the post-onboarding and approve loading it on the device
      track(
        "User chose CLS within the post-onboarding and approve loading it on the device screen",
        defaultPayload,
      );
    }
  }, [location, device, seedPathStatus, isPaired, isCLSLoading]);
};
