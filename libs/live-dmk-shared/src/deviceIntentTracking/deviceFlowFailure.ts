import type { DeviceModelId } from "@ledgerhq/types-devices";
import {
  BaseConnectionErrorTypes,
  BaseDiscoveryErrorTypes,
  ConnectDeviceUIStateTypes,
  type BaseConnectionError,
  type BaseDiscoveryError,
  type ConnectDeviceUIState,
  type KnownDevice,
} from "../connectDevice/types";
import {
  AppInteractionRequiredStateType,
  BlockingStateType,
  DeviceInteractionRequiredType,
  FinalStateType,
  isRetryableState,
  LoadingStateType,
  RetryableStateType,
  type EnsureAppReadyState,
} from "../device-action/EnsureAppReady/state";

export type DeviceFlowTransport = "ble" | "usb";

export type DeviceFlowDevice = Readonly<{
  modelId: DeviceModelId;
  transport: DeviceFlowTransport;
}>;

export const DeviceFlowFailureType = {
  DiscoveryError: "DiscoveryError",
  ConnectionError: "ConnectionError",
  ConnectDeviceUnknownError: "ConnectDeviceUnknownError",
  DeviceLocked: "DeviceLocked",
  UserRefusedOnDevice: "UserRefusedOnDevice",
  DeviceBusy: "DeviceBusy",
  DeviceDeprecatedBlocking: "DeviceDeprecatedBlocking",
  DeviceOutOfStorageSpace: "DeviceOutOfStorageSpace",
  UnsupportedFirmwareVersion: "UnsupportedFirmwareVersion",
  UnsupportedApplication: "UnsupportedApplication",
  UnsupportedFeature: "UnsupportedFeature",
  WrongDeviceForAccount: "WrongDeviceForAccount",
  DeviceNotOnboarded: "DeviceNotOnboarded",
  InvalidProvider: "InvalidProvider",
  ConnectAppError: "ConnectAppError",
  DeviceDisconnected: "DeviceDisconnected",
  InvalidOperation: "InvalidOperation",
} as const;

export type DeviceFlowFailureType =
  (typeof DeviceFlowFailureType)[keyof typeof DeviceFlowFailureType];

/**
 * Error screen displayed by the Device Intent Executor, captured when it is shown.
 * `countsAsFailure` decides whether closing the flow on it is reported as
 * `deviceflow_failed` or `deviceflow_aborted`.
 */
export type DeviceFlowFailure = Readonly<{
  failureType: DeviceFlowFailureType;
  countsAsFailure: boolean;
  subError?: string;
  modelId?: DeviceModelId;
  transport?: DeviceFlowTransport;
}>;

export type DeviceFlowFailureProperties = Readonly<{
  failureType?: DeviceFlowFailureType;
  subError?: string;
  modelId?: DeviceModelId;
  transport?: DeviceFlowTransport;
}>;

const UNKNOWN_SUB_ERROR = "Unknown";

function assertNever(value: never): never {
  throw new Error(`Unhandled value: ${String(value)}`);
}

/** Identifies an error with its DMK `_tag`, else its `name`. Never uses the unbounded `message`. */
export function getErrorSubError(error: unknown): string {
  if (typeof error !== "object" || error === null) return UNKNOWN_SUB_ERROR;
  if ("_tag" in error && typeof error._tag === "string") return error._tag;
  if ("name" in error && typeof error.name === "string") return error.name;
  return UNKNOWN_SUB_ERROR;
}

function toPascalCase(kebabCaseValue: string): string {
  return kebabCaseValue
    .split("-")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");
}

/**
 * Identifies a Connect Device error with its type, or with the wrapped error when the
 * type is `unknown`, which is the only type desktop emits.
 */
export function getConnectDeviceSubError(error: BaseDiscoveryError | BaseConnectionError): string {
  const isUnknownType =
    error.type === BaseDiscoveryErrorTypes.Unknown ||
    error.type === BaseConnectionErrorTypes.Unknown;
  if (!isUnknownType) return toPascalCase(error.type);
  return error.error === undefined ? UNKNOWN_SUB_ERROR : getErrorSubError(error.error);
}

export function getConnectDeviceFailure(
  state: ConnectDeviceUIState<BaseDiscoveryError, BaseConnectionError>,
  getTransport: (
    transportId: KnownDevice["transport"] | undefined,
  ) => DeviceFlowTransport | undefined,
): DeviceFlowFailure | null {
  switch (state.type) {
    case ConnectDeviceUIStateTypes.DiscoveryError:
      return {
        failureType: DeviceFlowFailureType.DiscoveryError,
        countsAsFailure: state.retry === undefined,
        subError: getConnectDeviceSubError(state.error),
        transport: getTransport(state.error.transportId),
      };
    case ConnectDeviceUIStateTypes.ConnectionError:
      return {
        failureType: DeviceFlowFailureType.ConnectionError,
        // Known pairing errors are user-fixable; an unknown one counts as failed even with Retry.
        countsAsFailure: state.error.type === BaseConnectionErrorTypes.Unknown,
        subError: getConnectDeviceSubError(state.error),
        modelId: state.device.deviceModelId,
        transport: getTransport(state.device.transport),
      };
    case ConnectDeviceUIStateTypes.UnknownError:
      return {
        failureType: DeviceFlowFailureType.ConnectDeviceUnknownError,
        countsAsFailure: true,
        subError: getErrorSubError(state.error),
      };
    default:
      return null;
  }
}

function getEnsureAppReadyFailureType(state: EnsureAppReadyState): DeviceFlowFailureType | null {
  switch (state.type) {
    case LoadingStateType.Loading:
    case LoadingStateType.InstallingApp:
    case DeviceInteractionRequiredType.UnlockDevice:
    case DeviceInteractionRequiredType.AllowSecureConnection:
    case DeviceInteractionRequiredType.ConfirmOpenApp:
    case AppInteractionRequiredStateType.DeviceDeprecatedNonBlocking:
    case AppInteractionRequiredStateType.OutdatedAppWarning:
    case FinalStateType.Success:
      return null;
    case RetryableStateType.DeviceLocked:
      return DeviceFlowFailureType.DeviceLocked;
    case RetryableStateType.UserRefusedOnDevice:
      return DeviceFlowFailureType.UserRefusedOnDevice;
    case RetryableStateType.DeviceBusy:
      return DeviceFlowFailureType.DeviceBusy;
    case BlockingStateType.DeviceDeprecatedBlocking:
      return DeviceFlowFailureType.DeviceDeprecatedBlocking;
    case BlockingStateType.DeviceOutOfStorageSpace:
      return DeviceFlowFailureType.DeviceOutOfStorageSpace;
    case BlockingStateType.UnsupportedFirmwareVersion:
      return DeviceFlowFailureType.UnsupportedFirmwareVersion;
    case BlockingStateType.UnsupportedApplication:
      return DeviceFlowFailureType.UnsupportedApplication;
    case BlockingStateType.UnsupportedFeature:
      return DeviceFlowFailureType.UnsupportedFeature;
    case BlockingStateType.WrongDeviceForAccount:
      return DeviceFlowFailureType.WrongDeviceForAccount;
    case BlockingStateType.DeviceNotOnboarded:
      return DeviceFlowFailureType.DeviceNotOnboarded;
    case BlockingStateType.InvalidProvider:
      return DeviceFlowFailureType.InvalidProvider;
    case FinalStateType.Error:
      return DeviceFlowFailureType.ConnectAppError;
    default:
      return assertNever(state);
  }
}

export function getEnsureAppReadyFailure(
  state: EnsureAppReadyState,
  device: DeviceFlowDevice,
): DeviceFlowFailure | null {
  const failureType = getEnsureAppReadyFailureType(state);
  if (!failureType) return null;

  return {
    failureType,
    countsAsFailure: !isRetryableState(state),
    subError: state.type === FinalStateType.Error ? getErrorSubError(state.error) : undefined,
    ...device,
  };
}

export function getDeviceDisconnectedFailure(device: DeviceFlowDevice): DeviceFlowFailure {
  return {
    failureType: DeviceFlowFailureType.DeviceDisconnected,
    countsAsFailure: true,
    ...device,
  };
}

export function getInvalidOperationFailure(error: unknown): DeviceFlowFailure {
  return {
    failureType: DeviceFlowFailureType.InvalidOperation,
    countsAsFailure: true,
    subError: getErrorSubError(error),
  };
}

export function getDeviceflowCancelEventName(
  failure: DeviceFlowFailure | null,
): "deviceflow_failed" | "deviceflow_aborted" {
  return failure?.countsAsFailure ? "deviceflow_failed" : "deviceflow_aborted";
}

export function getDeviceFlowFailureProperties(
  failure: DeviceFlowFailure | null,
): DeviceFlowFailureProperties {
  if (!failure) return {};

  return {
    failureType: failure.failureType,
    ...(failure.subError === undefined ? {} : { subError: failure.subError }),
    ...(failure.modelId === undefined ? {} : { modelId: failure.modelId }),
    ...(failure.transport === undefined ? {} : { transport: failure.transport }),
  };
}
