import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { FunnelProps, ScreenTracking } from "@features/platform-device-onboarding-analytics";

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
  /** Given only when a failed firmware check may be skipped, which turns cancel into skip. */
  onSkipFirmwareCheck?: () => void;
  onAcceptUpdate: () => void;
  onDeclineUpdate: () => void;
  onUpdatePressed?: () => void;
  onInstallUpdate?: () => void;
  onUpdateSheetClosed?: () => void;
  screensFor?: (step: UpdateStep | null) => readonly TrackedScreen[];
  /** Set in a tracked funnel: the drawers then send the funnel page names with these props. */
  funnelProps?: FunnelProps | null;
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
