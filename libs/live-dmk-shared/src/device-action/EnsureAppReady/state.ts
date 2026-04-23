import type { DeviceModelId } from "@ledgerhq/types-devices";
import type { DeprecationPresentationDecision } from "./deprecationPresentationTypes";

export type DeviceExtractedContext = {
  currentOsVersion: string;
  osUpdateAvailable: boolean;
  currentAppName: string;
  currentAppVersion: string;
  derivedAddress: string | undefined;
};

export enum AppInteractionRequiredStateType {
  DeviceDeprecatedNonBlocking = "device-deprecated-non-blocking",
  OutdatedAppWarning = "outdated-app-warning",
}

export enum DeviceInteractionRequiredType {
  ConfirmOpenApp = "confirm-open-app",
  AllowSecureConnection = "allow-secure-connection",
  UnlockDevice = "unlock-device",
}

/** For all non recoverable errors (job retry won't fix) */
export enum BlockingStateType {
  /** To map to DeviceDeprecationScreen */
  DeviceDeprecatedBlocking,
  /** To map to wording of error.OutOfMemoryDAError */
  DeviceOutOfStorageSpace,
  /** To map to wording of error.LatestFirmwareVersionRequired */
  UnsupportedFirmwareVersion,
  /** To map to wording of error.NoSuchAppOnProvider */
  UnsupportedApplication,
  /** Map to wording of error.UnsupportedFeatureError */
  UnsupportedFeature,
  /** To map to wording of error.WrongDeviceForAccount */
  WrongDeviceForAccount,
}

/** For all recoverable errors (job retry will fix) */
export enum RetryableStateType {
  DeviceLocked = "retryable-device-locked",
  UserRefusedOnDevice = "retryable-user-refused-on-device",
}

export enum LoadingStateType {
  Loading = "loading",
  InstallingApp = "installing-app",
}

export enum FinalStateType {
  Error = "error",
  Success = "success",
}

export type EnsureAppReadyState =
  | { type: LoadingStateType.Loading }
  | {
      type: LoadingStateType.InstallingApp;
      appName: string;
      progress: number;
      index: number;
      total: number;
    }
  | { type: DeviceInteractionRequiredType.UnlockDevice }
  | { type: DeviceInteractionRequiredType.AllowSecureConnection }
  | { type: DeviceInteractionRequiredType.ConfirmOpenApp }
  | {
      type: AppInteractionRequiredStateType.DeviceDeprecatedNonBlocking;
      decision: Extract<DeprecationPresentationDecision, { status: "show" }>;
      onContinue: () => void;
    }
  | {
      type: AppInteractionRequiredStateType.OutdatedAppWarning;
      appName: string;
      onContinue: () => void;
    }
  | {
      type: RetryableStateType.UserRefusedOnDevice;
    }
  | {
      type: RetryableStateType.DeviceLocked;
    }
  | {
      type: BlockingStateType.UnsupportedFirmwareVersion;
      updateInfo?: { currentVersion: string; latestVersion: string };
    }
  | {
      type: BlockingStateType.UnsupportedApplication;
      appName: string;
      deviceModelId: DeviceModelId;
    }
  | {
      type: BlockingStateType.UnsupportedFeature;
      deviceModelId: DeviceModelId;
    }
  | {
      type: BlockingStateType.DeviceDeprecatedBlocking;
      decision: Extract<DeprecationPresentationDecision, { status: "block" }>;
    }
  | {
      type: BlockingStateType.WrongDeviceForAccount;
      accountName: string;
    }
  | {
      type: BlockingStateType.DeviceOutOfStorageSpace;
      appNames: string[];
    }
  | { type: FinalStateType.Error; error: unknown }
  | { type: FinalStateType.Success; extractedContext: DeviceExtractedContext };
