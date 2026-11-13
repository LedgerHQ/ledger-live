import type { Device } from "@ledgerhq/live-common/hw/actions/types";

export type GenuineErrorKind = "declined" | "notGenuine" | "provider" | "network" | "unknown";

export type ChecksScreenState =
  | "synchronizing"
  | "idle"
  | "awaitingAllow"
  | "checking"
  | "updating"
  | "succeeded";

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
  onCloseSheet: () => void;
  /** Missing while the success screen is shown but the machine is not waiting on it yet. */
  onContinue?: () => void;
  /** Missing while the machine cannot be left, so the close button is hidden. */
  onQuit?: () => void;
  suspendSheets?: boolean;
  /**
   * The update an unseeded Nano held back until it was seeded. Asking for a USB cable would break
   * the setup the user just finished, so Bluetooth that cannot update says it is not possible.
   */
  updateAfterSetup?: boolean;
};
