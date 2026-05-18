import type { DeviceModelId } from "@ledgerhq/types-devices";
import type { DeprecationPresentationDecision } from "./deprecationPresentationTypes";

export type DeviceExtractedContext = {
  currentOsVersion: string;
  osUpdateAvailable: boolean;
  currentAppName: string;
  currentAppVersion: string;
  derivedAddress: string | undefined;
};

/** For all user interactions required in Ledger Wallet to continue the flow */
export enum AppInteractionRequiredStateType {
  DeviceDeprecatedNonBlocking = "device-deprecated-non-blocking",
  OutdatedAppWarning = "outdated-app-warning",
}

/** For all user interactions required on the device to continue the flow */
export enum DeviceInteractionRequiredType {
  ConfirmOpenApp = "confirm-open-app",
  AllowSecureConnection = "allow-secure-connection",
  UnlockDevice = "unlock-device",
}

/** For all non recoverable errors (job retry won't fix) */
export enum BlockingStateType {
  /** To map to DeviceDeprecationScreen */
  DeviceDeprecatedBlocking = "blocking-device-deprecated-blocking",
  /** To map to wording of error.OutOfMemoryDAError */
  DeviceOutOfStorageSpace = "blocking-device-out-of-storage-space",
  /**
   * To use in case the min app version is not in the catalog apps for
   * the current OS and apps catalog provider, and *THERE IS an OS* update available.
   * DMK should eventually refine this to determine between 2 cases:
   *  - app available on an up-to-date OS -> "must update OS".
   *  - app not available on an up-to-date OS -> "app satisfying min app version not available".
   *
   * To map to wording of error.LatestFirmwareVersionRequired
   */
  UnsupportedFirmwareVersion = "blocking-unsupported-firmware-version",
  /**
   * To use in case the min app version is not in the catalog apps for
   * the current OS and apps catalog provider, and *THERE ISN'T AN OS* update available.
   *
   * To map to wording of error.NoSuchAppOnProvider
   */
  UnsupportedApplication = "blocking-unsupported-application",
  /**
   * Same as UnsupportedApplication, but for Nano S.
   * Map to wording of error.UnsupportedFeatureError
   */
  UnsupportedFeature = "blocking-unsupported-feature",
  /** To map to wording of error.WrongDeviceForAccount */
  WrongDeviceForAccount = "blocking-wrong-device-for-account",
  /** To map to wording of error.DeviceNotOnboarded */
  DeviceNotOnboarded = "blocking-device-not-onboarded",
}

/** For all recoverable errors (job retry will fix) */
export enum RetryableStateType {
  DeviceLocked = "retryable-device-locked",
  UserRefusedOnDevice = "retryable-user-refused-on-device",
  DeviceBusy = "retryable-device-busy",
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
  | { type: LoadingStateType.InstallingApp }
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
      retry: () => void;
    }
  | {
      type: RetryableStateType.DeviceLocked;
      retry: () => void;
    }
  | {
      type: RetryableStateType.DeviceBusy;
      retry: () => void;
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
  | {
      type: BlockingStateType.DeviceNotOnboarded;
    }
  | { type: FinalStateType.Error; error: unknown }
  | { type: FinalStateType.Success; extractedContext: DeviceExtractedContext };

export function isRetryableState(state: EnsureAppReadyState): boolean {
  switch (state.type) {
    case RetryableStateType.DeviceLocked:
    case RetryableStateType.UserRefusedOnDevice:
    case RetryableStateType.DeviceBusy:
      return true;
    default:
      return false;
  }
}
