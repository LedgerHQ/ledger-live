import type {
  ConnectedDevice,
  DeviceManagementKit,
  DiscoveredDevice,
  TransportIdentifier,
} from "@ledgerhq/device-management-kit";
import type { DeviceModelId } from "@ledgerhq/types-devices";
import type { Observable } from "rxjs";

export type Device = {
  transport: TransportIdentifier;
  deviceModelId: DeviceModelId;
  id: string;
  name: string | null;
};

export enum BaseConnectionErrorTypes {
  Unknown = "unknown",
}

export enum BaseDiscoveryErrorTypes {
  Unknown = "unknown",
}

export type BaseConnectionError = {
  type: string;
  error?: unknown;
};

export type UnknownConnectionError = {
  type: BaseConnectionErrorTypes.Unknown;
  error?: unknown;
};

export type BaseDiscoveryError = {
  type: string;
  transportId?: TransportIdentifier;
  resolution?: DiscoveryErrorResolution<BaseDiscoveryError>;
  error?: unknown;
};

export type UnknownDiscoveryError = {
  type: BaseDiscoveryErrorTypes.Unknown;
  transportId?: TransportIdentifier;
  resolution?: DiscoveryErrorResolution<BaseDiscoveryError>;
  error?: unknown;
};

export type DiscoveryErrorResolution<
  TDiscoveryError extends BaseDiscoveryError = BaseDiscoveryError,
> =
  | {
      type: "prompt";
      retry: () => Promise<true | TDiscoveryError>;
    }
  | {
      type: "manual-action";
      retry: () => Promise<true | TDiscoveryError>;
    }
  | {
      type: "check-only";
      retry: () => Promise<true | TDiscoveryError>;
    }
  | {
      type: "none";
    };

export type DeviceDiscoveryStartArgs = {
  ignoreTransportIdentifiers?: Array<TransportIdentifier>;
};

export interface DeviceDiscoveryService<
  TDiscoveryError extends BaseDiscoveryError = BaseDiscoveryError,
> {
  start(args?: DeviceDiscoveryStartArgs): void;
  stop(): void;
  transportIds: Array<TransportIdentifier>;
  discoveredDevices: Observable<DiscoveredDevice[]>;
  errors: Observable<TDiscoveryError>;
}

/**
 * Result of a successful device connection, providing everything needed to
 * interact with the device during intent execution.
 */
export type DeviceConnectionResult = {
  /** Device Management Kit instance bound to the current session. */
  dmk: DeviceManagementKit;
  /** Active DMK session identifier. */
  sessionId: string;
  /** ConnectedDevice */
  connectedDevice: ConnectedDevice;
  /** Legacy device identifier, usable by existing `withDevice` / `DeviceAction` flows. */
  compatDeviceId: string;
  compatDeviceName: string;
  compatDeviceWired: boolean;
};

/**
 * UI states shared by every device connectivity flow, so that their errors render the same way.
 */
export enum ConnectivityUIStateTypes {
  DiscoveryError = "discovery-error",
  ConnectionError = "connection-error",
  /**
   * Terminal state emitted by the use case when an unexpected error escapes the inner
   * state machine. Has no retry / ignore: the host UI is expected to display a generic
   * error and let the user dismiss the surrounding flow.
   */
  UnknownError = "unknown-error",
}

export type DiscoveryErrorUIState<TDiscoveryError extends BaseDiscoveryError = BaseDiscoveryError> =
  {
    type: ConnectivityUIStateTypes.DiscoveryError;
    error: TDiscoveryError;
    retry?: () => void;
    ignore: () => void;
  };

export type ConnectionErrorUIState<
  TConnectionError extends BaseConnectionError = BaseConnectionError,
> = {
  type: ConnectivityUIStateTypes.ConnectionError;
  error: TConnectionError;
  device: Device;
  retry: () => void;
  ignore: () => void;
};

export type UnknownErrorUIState = {
  type: ConnectivityUIStateTypes.UnknownError;
  error: unknown;
};
