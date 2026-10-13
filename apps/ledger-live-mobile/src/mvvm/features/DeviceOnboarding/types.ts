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
  onStart: () => void;
  onRetry: () => void;
  onAcceptUpdate: () => void;
  onDeclineUpdate: () => void;
  onCloseSheet: () => void;
  onContinue: () => void;
  onQuit: () => void;
};
