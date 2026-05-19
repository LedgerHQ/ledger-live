import type {
  DeviceSessionState,
  GetAppAndVersionResponse,
  GetDeviceMetadataDAOutput,
  InstallPlan,
} from "@ledgerhq/device-management-kit";
import {
  DeviceActionStatus,
  DeviceExchangeError,
  DeviceLockedError,
  DeviceModelId,
  AlreadySendingApduError,
  OutOfMemoryDAError,
  RefusedByUserDAError,
  UnsupportedFirmwareDAError,
  UserInteractionRequired,
} from "@ledgerhq/device-management-kit";
import { StatusCodes } from "@ledgerhq/hw-transport";
import { DeviceDeprecationError, UserInteractionRequiredLL } from "../ConnectApp/types";
import { dmkToLedgerDeviceIdMap } from "../../config/dmkToLedgerDeviceIdMap";
import { decideDeprecationPresentation } from "./deprecationPresentation";
import type { ConnectAppDAState } from "../ConnectApp/types";
import {
  AppInteractionRequiredStateType,
  BlockingStateType,
  type EnsureAppReadyState,
  type DeviceExtractedContext,
  DeviceInteractionRequiredType,
  FinalStateType,
  LoadingStateType,
  RetryableStateType,
} from "./state";
import type { DeprecationPresentationInput } from "./types";

function assertNever(value: never): never {
  throw new Error(`Unhandled value: ${String(value)}`);
}

function isObjectLike(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function hasTag<Tag extends string>(value: unknown, tag: Tag): value is { _tag: Tag } {
  return isObjectLike(value) && "_tag" in value && value._tag === tag;
}

function hasStatusCode(value: unknown, statusCode: number): value is { statusCode: number } {
  return isObjectLike(value) && value.statusCode === statusCode;
}

export function mapConnectAppDAPendingStatus(params: {
  state: Extract<ConnectAppDAState, { status: DeviceActionStatus.Pending }>;
  deprecation?: DeprecationPresentationInput;
  deprecationDismissedCurrencyNames: string[];
}): EnsureAppReadyState | null {
  const { state, deprecation, deprecationDismissedCurrencyNames } = params;
  const { intermediateValue } = state;

  switch (intermediateValue.requiredUserInteraction) {
    case UserInteractionRequired.ConfirmOpenApp:
      return {
        type: DeviceInteractionRequiredType.ConfirmOpenApp,
      };

    case UserInteractionRequired.AllowSecureConnection:
    case UserInteractionRequired.AllowListApps:
      return {
        type: DeviceInteractionRequiredType.AllowSecureConnection,
      };

    case UserInteractionRequired.UnlockDevice:
      return {
        type: DeviceInteractionRequiredType.UnlockDevice,
      };

    case UserInteractionRequired.None:
      if (intermediateValue.installPlan) return { type: LoadingStateType.InstallingApp };
      return { type: LoadingStateType.Loading };

    case UserInteractionRequiredLL.DeviceDeprecation:
      return mapDeprecationState({
        deviceDeprecationRules: intermediateValue.deviceDeprecation,
        deprecation,
        deprecationDismissedCurrencyNames,
      });

    default:
      assertNever(intermediateValue.requiredUserInteraction);
  }
}

function mapDeprecationState(params: {
  deviceDeprecationRules: Extract<
    Extract<ConnectAppDAState, { status: DeviceActionStatus.Pending }>["intermediateValue"],
    { deviceDeprecation: unknown }
  >["deviceDeprecation"];
  deprecation?: DeprecationPresentationInput;
  deprecationDismissedCurrencyNames: string[];
}): EnsureAppReadyState | null {
  const { deviceDeprecationRules, deprecation, deprecationDismissedCurrencyNames } = params;

  if (!deviceDeprecationRules) {
    return null;
  }

  if (!deprecation) {
    return null;
  }

  const decision = decideDeprecationPresentation({
    rules: deviceDeprecationRules,
    flow: deprecation.flow,
    currencyName: deprecation.currencyName,
    deprecationDismissedCurrencyNames,
  });

  if (decision.status === "skipped") {
    deviceDeprecationRules.onContinue(false);
    return null;
  }

  if (decision.status === "show") {
    return {
      type: AppInteractionRequiredStateType.DeviceDeprecatedNonBlocking,
      decision,
      onContinue: () => deviceDeprecationRules.onContinue(false),
    };
  }

  deviceDeprecationRules.onContinue(true);
  return {
    type: BlockingStateType.DeviceDeprecatedBlocking,
    decision,
  };
}

function mapUnsupportedFirmwareState(deviceState: DeviceSessionState): EnsureAppReadyState {
  const firmwareUpdateContext =
    "firmwareUpdateContext" in deviceState ? deviceState.firmwareUpdateContext : undefined;
  const currentVersion = firmwareUpdateContext?.currentFirmware?.version;
  const latestVersion = firmwareUpdateContext?.availableUpdate?.finalFirmware.version;
  const updateInfo =
    currentVersion && latestVersion
      ? {
          currentVersion,
          latestVersion,
        }
      : undefined;

  return {
    type: BlockingStateType.UnsupportedFirmwareVersion,
    updateInfo,
  };
}

function mapUnsupportedApplicationState(params: {
  deviceState: DeviceSessionState;
  appName: string;
}): EnsureAppReadyState {
  const { deviceState, appName } = params;
  const deviceModelId = deviceState.deviceModelId;

  if (deviceModelId === DeviceModelId.NANO_S) {
    return {
      type: BlockingStateType.UnsupportedApplication,
      appName,
      deviceModelId: dmkToLedgerDeviceIdMap[deviceModelId],
    };
  }

  return {
    type: BlockingStateType.UnsupportedFeature,
    deviceModelId: dmkToLedgerDeviceIdMap[deviceModelId],
  };
}

export function mapConnectAppDAErrorStatus(params: {
  state: Extract<ConnectAppDAState, { status: DeviceActionStatus.Error }>;
  appName: string;
  getCurrentDeviceState: () => DeviceSessionState;
  latestInstallPlan: InstallPlan | null;
  retry: () => void;
}): EnsureAppReadyState | null {
  const {
    state: { error },
    appName,
    getCurrentDeviceState,
    latestInstallPlan,
    retry,
  } = params;

  if (error instanceof OutOfMemoryDAError) {
    const appNames = latestInstallPlan?.installPlan.map(app => app.versionName) ?? [appName];

    return {
      type: BlockingStateType.DeviceOutOfStorageSpace,
      appNames,
    };
  }

  if (hasTag(error, "DeviceNotOnboardedError")) {
    return {
      type: BlockingStateType.DeviceNotOnboarded,
    };
  }

  const deviceState = getCurrentDeviceState();

  if (error instanceof UnsupportedFirmwareDAError) {
    return mapUnsupportedFirmwareState(deviceState);
  }

  if (hasTag(error, "UnsupportedApplicationDAError")) {
    return mapUnsupportedApplicationState({ deviceState, appName });
  }

  if (error instanceof AlreadySendingApduError || hasTag(error, "AlreadySendingApduError")) {
    return {
      type: RetryableStateType.DeviceBusy,
      retry,
    };
  }

  if (error instanceof DeviceDeprecationError) {
    /** Returning null because the state is handled in mapDeprecationState */
    return null;
  }

  if (
    error instanceof DeviceLockedError ||
    // Legacy getAddress calls run through DmkCompatTransport during requiredDerivation.
    // LedgerJS maps APDU status 0x5515 to LockedDeviceError, which reaches this mapper
    // as a transport status shape rather than DMK's DeviceLockedError.
    hasStatusCode(error, StatusCodes.LOCKED_DEVICE)
  ) {
    return {
      type: RetryableStateType.DeviceLocked,
      retry,
    };
  }

  if (error instanceof RefusedByUserDAError) {
    return {
      type: RetryableStateType.UserRefusedOnDevice,
      retry,
    };
  }

  if (error instanceof DeviceExchangeError && error.errorCode === "5501") {
    return {
      type: RetryableStateType.UserRefusedOnDevice,
      retry,
    };
  }

  return {
    type: FinalStateType.Error,
    error,
  };
}

export function buildExtractedContext(params: {
  deviceMetadata: GetDeviceMetadataDAOutput | undefined;
  currentApp: GetAppAndVersionResponse;
  derivation: string | undefined;
}): DeviceExtractedContext {
  const { deviceMetadata, currentApp, derivation } = params;

  return {
    currentOsVersion: deviceMetadata?.firmwareVersion.os ?? "unknown",
    osUpdateAvailable: Boolean(deviceMetadata?.firmwareUpdateContext?.availableUpdate),
    currentAppName: currentApp.name,
    currentAppVersion: currentApp.version,
    derivedAddress: derivation,
  };
}
