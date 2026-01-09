import type { AppInstallConfig } from "./constants/appInstallMap";

export type InstallStep = "confirmation" | "success" | "error";

export interface InstallDrawerProps {
  isOpen: boolean;
  appConfig: AppInstallConfig | null;
  onClose: () => void;
}

export interface ConfirmationStepProps {
  appConfig: AppInstallConfig;
  onConfirm: () => void;
  onCancel: () => void;
}

export interface SuccessStepProps {
  appConfig: AppInstallConfig;
  onDone: () => void;
}

export interface ErrorStepProps {
  error: Error;
  appConfig: AppInstallConfig;
  onRetry: () => void;
  onClose: () => void;
}
