import type {
  ConnectedDevice,
  DeviceManagementKit,
  DiscoveredDevice,
  TransportIdentifier,
} from "@ledgerhq/device-management-kit";
import type { Observer } from "rxjs";

import {
  ConnectivityUIStateTypes,
  type BaseConnectionError,
  type BaseDiscoveryError,
  type ConnectionErrorUIState,
  type Device,
  type DeviceConnectionResult,
  type DeviceDiscoveryService,
  type DiscoveryErrorUIState,
  type UnknownErrorUIState,
} from "../deviceConnectivity/types";

export type SelectableDevice =
  | { device: Device; isAvailable: true; onSelect: () => void }
  | { device: Device; isAvailable: false };

export type ListedDevice = {
  discoveredDevice: DiscoveredDevice;
  isAvailable: boolean;
};

/** Returns the same key for the same device in every discovery update. */
export type ConnectNewDeviceGetDiscoveredDeviceKey = (discoveredDevice: DiscoveredDevice) => string;

export type ConnectNewDeviceMapConnectionError<
  TConnectionError extends BaseConnectionError = BaseConnectionError,
> = (error: unknown) => TConnectionError;

export type ConnectNewDeviceStateMachineInput<
  TDiscoveryError extends BaseDiscoveryError = BaseDiscoveryError,
  TConnectionError extends BaseConnectionError = BaseConnectionError,
> = {
  dmk: DeviceManagementKit;
  deviceDiscoveryService: DeviceDiscoveryService<TDiscoveryError>;
  observer: Observer<ConnectNewDeviceUIState<TDiscoveryError, TConnectionError>>;
  onConnected: (result: DeviceConnectionResult) => void;
  onClose: () => void;
  mapConnectionError: ConnectNewDeviceMapConnectionError<TConnectionError>;
  getDiscoveredDeviceKey: ConnectNewDeviceGetDiscoveredDeviceKey;
  buildCompatDeviceId?: (device: ConnectedDevice) => string;
  deviceNotFoundDelay?: number;
  successDelay?: number;
};

export type ConnectNewDeviceStateMachineContext<
  TDiscoveryError extends BaseDiscoveryError = BaseDiscoveryError,
  TConnectionError extends BaseConnectionError = BaseConnectionError,
> = ConnectNewDeviceStateMachineInput<TDiscoveryError, TConnectionError> & {
  deviceNotFoundDelay: number;
  successDelay: number;
  listedDevices: Array<ListedDevice>;
  selectedDevice: DiscoveredDevice | null;
  sessionId: string | null;
  isDiscovering: boolean;
  showDeviceNotFound: boolean;
  discoveryError: TDiscoveryError | null;
  connectionError: TConnectionError | null;
  skipTransportIds: Array<TransportIdentifier>;
};

export enum ConnectNewDeviceStateMachineEventTypes {
  DevicesDiscovered = "devices-discovered",
  DiscoveryError = "discovery-error",
  UserTapsDevice = "user-taps-device",
  UserTapsDiscoveryRetry = "user-taps-discovery-retry",
  UserTapsDiscoveryIgnore = "user-taps-discovery-ignore",
  UserClosesDiscoveryError = "user-closes-discovery-error",
  UserTapsConnectionRetry = "user-taps-connection-retry",
  UserTapsConnectionIgnore = "user-taps-connection-ignore",
  UserClosesConnectionError = "user-closes-connection-error",
}

export type ConnectNewDeviceStateMachineEvent<
  TDiscoveryError extends BaseDiscoveryError = BaseDiscoveryError,
> =
  | {
      type: ConnectNewDeviceStateMachineEventTypes.DevicesDiscovered;
      devices: Array<DiscoveredDevice>;
    }
  | {
      type: ConnectNewDeviceStateMachineEventTypes.DiscoveryError;
      error: TDiscoveryError;
    }
  | {
      type: ConnectNewDeviceStateMachineEventTypes.UserTapsDevice;
      discoveredDevice: DiscoveredDevice;
    }
  | {
      type: ConnectNewDeviceStateMachineEventTypes.UserTapsDiscoveryRetry;
    }
  | {
      type: ConnectNewDeviceStateMachineEventTypes.UserTapsDiscoveryIgnore;
    }
  | {
      type: ConnectNewDeviceStateMachineEventTypes.UserClosesDiscoveryError;
    }
  | {
      type: ConnectNewDeviceStateMachineEventTypes.UserTapsConnectionRetry;
    }
  | {
      type: ConnectNewDeviceStateMachineEventTypes.UserTapsConnectionIgnore;
    }
  | {
      type: ConnectNewDeviceStateMachineEventTypes.UserClosesConnectionError;
    };

/**
 * Includes the shared `ConnectivityUIStateTypes` members, so that connectNewDevice consumers can use
 * one object for every state. In type positions, use `typeof ConnectNewDeviceUIStateTypes.X`.
 */
export const ConnectNewDeviceUIStateTypes = {
  ...ConnectivityUIStateTypes,
  Discovering: "discovering",
  Connecting: "connecting",
  Connected: "connected",
  Done: "done",
  Terminated: "terminated",
} as const;

export type ConnectNewDeviceUIStateType =
  (typeof ConnectNewDeviceUIStateTypes)[keyof typeof ConnectNewDeviceUIStateTypes];

export type ConnectNewDeviceUIState<
  TDiscoveryError extends BaseDiscoveryError = BaseDiscoveryError,
  TConnectionError extends BaseConnectionError = BaseConnectionError,
> =
  | {
      type: typeof ConnectNewDeviceUIStateTypes.Discovering;
      devices: Array<SelectableDevice>;
      scanningTransports: Array<TransportIdentifier>;
      showDeviceNotFound: boolean;
    }
  | {
      type: typeof ConnectNewDeviceUIStateTypes.Connecting;
      device: Device;
    }
  | {
      type: typeof ConnectNewDeviceUIStateTypes.Connected;
      device: Device;
    }
  | {
      type: typeof ConnectNewDeviceUIStateTypes.Done;
      device: Device;
    }
  | {
      type: typeof ConnectNewDeviceUIStateTypes.Terminated;
    }
  | (DiscoveryErrorUIState<TDiscoveryError> & { close: () => void })
  | (ConnectionErrorUIState<TConnectionError> & { close: () => void })
  | UnknownErrorUIState;
