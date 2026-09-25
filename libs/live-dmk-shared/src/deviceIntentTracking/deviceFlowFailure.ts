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
  BlockingStateType,
  FinalStateType,
  isRetryableState,
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
 * Failure displayed by the Device Intent Executor, captured when the error state is
 * shown so that closing the flow later reports what the user actually saw.
 * A terminal failure is reported as `deviceflow_failed`, any other as `deviceflow_aborted`.
 */
export type DeviceFlowFailure = Readonly<{
  failureType: DeviceFlowFailureType;
  isTerminal: boolean;
  subError?: string;
  modelId?: DeviceModelId;
  transport?: DeviceFlowTransport;
}>;

export type DeviceFlowFailureProperties = Readonly<{
  failureType: DeviceFlowFailureType;
  subError?: string;
  modelId?: DeviceModelId;
  transport?: DeviceFlowTransport;
}>;

const UNKNOWN_SUB_ERROR = "Unknown";

const ENSURE_APP_READY_FAILURE_TYPES: Partial<
  Record<EnsureAppReadyState["type"], DeviceFlowFailureType>
> = {
  [RetryableStateType.DeviceLocked]: DeviceFlowFailureType.DeviceLocked,
  [RetryableStateType.UserRefusedOnDevice]: DeviceFlowFailureType.UserRefusedOnDevice,
  [RetryableStateType.DeviceBusy]: DeviceFlowFailureType.DeviceBusy,
  [BlockingStateType.DeviceDeprecatedBlocking]: DeviceFlowFailureType.DeviceDeprecatedBlocking,
  [BlockingStateType.DeviceOutOfStorageSpace]: DeviceFlowFailureType.DeviceOutOfStorageSpace,
  [BlockingStateType.UnsupportedFirmwareVersion]: DeviceFlowFailureType.UnsupportedFirmwareVersion,
  [BlockingStateType.UnsupportedApplication]: DeviceFlowFailureType.UnsupportedApplication,
  [BlockingStateType.UnsupportedFeature]: DeviceFlowFailureType.UnsupportedFeature,
  [BlockingStateType.WrongDeviceForAccount]: DeviceFlowFailureType.WrongDeviceForAccount,
  [BlockingStateType.DeviceNotOnboarded]: DeviceFlowFailureType.DeviceNotOnboarded,
  [BlockingStateType.InvalidProvider]: DeviceFlowFailureType.InvalidProvider,
  [FinalStateType.Error]: DeviceFlowFailureType.ConnectAppError,
};

let currentDeviceFlowFailure: DeviceFlowFailure | null = null;

export function setDeviceFlowFailure(failure: DeviceFlowFailure | null): void {
  currentDeviceFlowFailure = failure;
}

/** Returns the current failure and clears it, so a failure is reported at most once. */
export function takeDeviceFlowFailure(): DeviceFlowFailure | null {
  const failure = currentDeviceFlowFailure;
  currentDeviceFlowFailure = null;
  return failure;
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
        isTerminal: state.retry === undefined,
        subError: getConnectDeviceSubError(state.error),
        transport: getTransport(state.error.transportId),
      };
    case ConnectDeviceUIStateTypes.ConnectionError:
      return {
        failureType: DeviceFlowFailureType.ConnectionError,
        isTerminal: state.error.type === BaseConnectionErrorTypes.Unknown,
        subError: getConnectDeviceSubError(state.error),
        modelId: state.device.deviceModelId,
        transport: getTransport(state.device.transport),
      };
    case ConnectDeviceUIStateTypes.UnknownError:
      return {
        failureType: DeviceFlowFailureType.ConnectDeviceUnknownError,
        isTerminal: true,
        subError: getErrorSubError(state.error),
      };
    default:
      return null;
  }
}

export function getEnsureAppReadyFailure(
  state: EnsureAppReadyState,
  device: DeviceFlowDevice,
): DeviceFlowFailure | null {
  const failureType = ENSURE_APP_READY_FAILURE_TYPES[state.type];
  if (!failureType) return null;

  return {
    failureType,
    isTerminal: !isRetryableState(state),
    subError: state.type === FinalStateType.Error ? getErrorSubError(state.error) : undefined,
    ...device,
  };
}

export function getDeviceDisconnectedFailure(device: DeviceFlowDevice): DeviceFlowFailure {
  return { failureType: DeviceFlowFailureType.DeviceDisconnected, isTerminal: true, ...device };
}

export function getInvalidOperationFailure(error: unknown): DeviceFlowFailure {
  return {
    failureType: DeviceFlowFailureType.InvalidOperation,
    isTerminal: true,
    subError: getErrorSubError(error),
  };
}

export function getDeviceflowCancelEventName(
  failure: DeviceFlowFailure | null,
): "deviceflow_failed" | "deviceflow_aborted" {
  return failure?.isTerminal ? "deviceflow_failed" : "deviceflow_aborted";
}

export function getDeviceFlowFailureProperties(
  failure: DeviceFlowFailure,
): DeviceFlowFailureProperties {
  return {
    failureType: failure.failureType,
    ...(failure.subError === undefined ? {} : { subError: failure.subError }),
    ...(failure.modelId === undefined ? {} : { modelId: failure.modelId }),
    ...(failure.transport === undefined ? {} : { transport: failure.transport }),
  };
}
