import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { ChecksScreenState, GenuineErrorKind } from "LLM/features/DeviceOnboarding/types";
import type { SetupStage } from "./toSetupStage";

export type SetupChecksProps = {
  state: ChecksScreenState;
  error: { kind: GenuineErrorKind } | null;
  update: { current: string; available: string } | null;
  onStart: () => void;
  onRetry: () => void;
  onCloseSheet: () => void;
  onAcceptUpdate: () => void;
  onDeclineUpdate: () => void;
  onCloseFirmwareOffer?: () => void;
};

export type SetupScreenProps = {
  device: Device;
  stage: SetupStage;
  checks: SetupChecksProps | null;
  firmwareUpToDate: boolean;
  leaveRequest: number;
  onLeave: () => void;
};
