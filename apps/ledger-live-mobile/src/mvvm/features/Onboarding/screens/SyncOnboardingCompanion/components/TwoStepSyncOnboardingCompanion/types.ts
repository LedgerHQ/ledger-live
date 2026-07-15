import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { SyncOnboardingScreenProps } from "../../types";

export type TwoStepSyncOnboardingCompanionProps = {
  /**
   * A `Device` object
   */
  device: Device;
  /**
   * A react-navigation instance to handle navigation once the device is ready, when there is a desync
   * issue, and to update the react-navigation header with available languages
   */
  navigation: SyncOnboardingScreenProps["navigation"];
  /**
   * Called when the polling from the companion component has definitely lost/is desync with the device
   */
  onLostDevice: () => void;
  /**
   * Called when the companion is displaying an alert message that should overlay
   * all the screen, including the header
   */
  onShouldHeaderBeOverlaid: (shouldBeOverlaid: boolean) => void;
  /**
   * Updates any existing delay before displaying the hiding the header below an overlay
   */
  updateHeaderOverlayDelay: (delayMs: number) => void;
  /**
   * Called by the companion component to force a reset of the entire sync onboarding because the device is not in a correct state anymore
   */
  notifyEarlySecurityCheckShouldReset: () => void;
};
