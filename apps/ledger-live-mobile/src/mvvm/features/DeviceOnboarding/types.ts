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
};
