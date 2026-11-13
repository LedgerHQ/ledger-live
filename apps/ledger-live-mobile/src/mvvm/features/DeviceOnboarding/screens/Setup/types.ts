import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { ChecksScreenState, GenuineErrorKind } from "LLM/features/DeviceOnboarding/types";
import type { SetupStage } from "./toSetupStage";

export type SetupChecksProps = {
  state: ChecksScreenState;
  error: { kind: GenuineErrorKind } | null;
  /** The device failed the genuine check in this session: no retry can pass it. */
  deviceNotGenuine: boolean;
  update: { current: string; available: string } | null;
  onStart: () => void;
  onRetry: () => void;
  onCloseSheet: () => void;
  onAcceptUpdate: () => void;
  onDeclineUpdate: () => void;
};

export type SetupScreenProps = {
  device: Device;
  stage: SetupStage;
  checks: SetupChecksProps | null;
  onQuit: () => void;
  suspendSheets?: boolean;
};
