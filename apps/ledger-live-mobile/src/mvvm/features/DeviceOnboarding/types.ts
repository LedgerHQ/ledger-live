import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { DeviceModelId, ScreenTracking } from "@features/platform-device-onboarding-analytics";

export type TrackedScreen = Readonly<{ key: string; tracking: ScreenTracking }>;

export type GenuineErrorKind = "declined" | "notGenuine" | "provider" | "network" | "unknown";

export type ChecksScreenState =
  | "synchronizing"
  | "idle"
  | "awaitingAllow"
  | "checking"
  | "updating"
  | "succeeded";

export type DeviceUnlockSheetProps = Readonly<{
  deviceModelId: Device["modelId"];
  deviceName: string;
}>;

export type UpdateStep =
  | "offerSheet"
  | "decisionScreen"
  | "unsupportedUsbDrawer"
  | "unsupportedNotEligibleDrawer";

export type ChecksScreenProps = {
  device: Device;
  state: ChecksScreenState;
  error: { kind: GenuineErrorKind } | null;
  update: { current: string; available: string } | null;
  firmwareUpToDate: boolean;
  onStart: () => void;
  onRetry: () => void;
  onAcceptUpdate: () => void;
  onDeclineUpdate: () => void;
  onUpdatePressed?: () => void;
  onInstallUpdate?: () => void;
  onUpdateSheetClosed?: () => void;
  screensFor?: (step: UpdateStep | null) => readonly TrackedScreen[];
  /** Set only in the seeded funnel: the drawers then send the seeded page names. */
  seededDeviceType?: DeviceModelId | null;
  onCloseSheet: () => void;
  /** Missing while the success screen is shown but the machine is not waiting on it yet. */
  onContinue?: () => void;
  /** Missing while the machine cannot be left, so the close button is hidden. */
  onQuit?: () => void;
  /** Runs when the user taps a close control, before `onQuit`. Drawer Cancel does not call it. */
  onClosePressed?: () => void;
  suspendSheets?: boolean;
  /**
   * The update an unseeded Nano held back until it was seeded. Asking for a USB cable would break
   * the setup the user just finished, so Bluetooth that cannot update says it is not possible.
   */
  updateAfterSetup?: boolean;
};
