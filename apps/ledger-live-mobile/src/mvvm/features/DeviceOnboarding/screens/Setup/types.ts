import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { ChecksScreenState, GenuineErrorKind } from "LLM/features/DeviceOnboarding/types";
import type { SessionReconnect } from "@features/flow-device-onboarding-reconnect";
import type { FunnelProps } from "@features/platform-device-onboarding-analytics";
import type { SetupStage } from "@features/flow-device-onboarding-setup-stage";
import type { SetupInfoCard } from "@features/flow-device-onboarding-setup-info";

/** A stepper stage, with the info card the screen shows above it. */
export type SetupScreenStage = SetupStage & { infoCard?: SetupInfoCard };

export type SetupChecksProps = {
  state: ChecksScreenState;
  error: { kind: GenuineErrorKind } | null;
  /** The device failed the genuine check in this session: no retry can pass it. */
  deviceNotGenuine: boolean;
  update: { current: string; available: string } | null;
  /** The user left the update screen without updating: the re-offered update asks to confirm the skip. */
  confirmSkipUpdate: boolean;
  onStart: () => void;
  onRetry: () => void;
  onCloseSheet: () => void;
  onAcceptUpdate: () => void;
  onDeclineUpdate: () => void;
  /** Ends the OS check after setup when it fails: the device is set up and usable without it. */
  onSkipFirmwareCheck?: () => void;
};

export type SetupScreenProps = {
  device: Device;
  stage: SetupScreenStage;
  checks: SetupChecksProps | null;
  onQuit: () => void;
  suspendSheets?: boolean;
  reportsRecoveryKey?: boolean;
  connection?: SessionReconnect | null;
  firmwareDeclined?: boolean;
  /** Set for a tracked funnel: the checks and update sheets send their events with these. */
  funnelProps?: FunnelProps | null;
};
