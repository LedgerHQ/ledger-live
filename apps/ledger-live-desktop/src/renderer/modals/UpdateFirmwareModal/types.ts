import { DeviceInfo, FirmwareUpdateContext } from "@ledgerhq/types-live";
import { DeviceModelId } from "@ledgerhq/devices";

export const STEPS = {
  RESET_DEVICE: "resetDevice",
  ID_CHECK: "idCheck",
  UPDATE_MCU: "updateMCU",
  UPDATING: "updating",
  RESTORE: "restore",
  FINISH: "finish",
} as const;

export type StepId = (typeof STEPS)[keyof typeof STEPS];

export type StepProps = {
  firmware?: FirmwareUpdateContext;
  appsToBeReinstalled: boolean;
  onDrawerClose: (reinstall?: boolean) => void;
  error?: Error | null | undefined;
  setError: (e: Error | null) => void;
  CLSBackup?: string;
  deviceModelId: DeviceModelId;
  deviceInfo: DeviceInfo;
  updatedDeviceInfo?: DeviceInfo;
  setUpdatedDeviceInfo: (d: DeviceInfo) => void;
  transitionTo: (step: StepId) => void;
  onRetry: () => void;
  setCLSBackup: (hexImage: string) => void;

  completedRestoreSteps: string[];
  setCompletedRestoreSteps: (arg0: string[]) => void;
  currentRestoreStep: string;
  setCurrentRestoreStep: (arg0: string) => void;
  isLanguagePromptOpen: boolean;
  setIsLanguagePromptOpen: (arg0: boolean) => void;
  confirmedPrompt: boolean;
  setConfirmedPrompt: (arg0: boolean) => void;
  nonce: number;
  setNonce: (arg0: number) => void;
  setFirmwareUpdateCompleted: (arg0: boolean) => void;

  finalStepSuccessDescription?: string;
  finalStepSuccessButtonLabel?: string;
  finalStepSuccessButtonOnClick?: () => void;
  shouldReloadManagerOnCloseIfUpdateRefused?: boolean;
  deviceHasPin?: boolean;
};

export type Step = {
  id: StepId;
  label: string;
  component: React.FunctionComponent<StepProps>;
  footer?: React.FunctionComponent<StepProps>;
};
