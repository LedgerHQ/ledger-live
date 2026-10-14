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

/**
 * A device the user has already connected to, as saved in the app's known devices.
 */
export type KnownDevice = Device;

export type MatchedDevice = {
  knownDevice: KnownDevice;
  discoveredDevice: DiscoveredDevice;
};

export type DisplayedDevice =
  | {
      type: "not-available";
      knownDevice: KnownDevice;
      onSelect: () => void;
    }
  | {
      type: "available";
      knownDevice: KnownDevice;
      onSelect: () => void;
    };

export type ConnectDeviceMatchDiscoveredDevices = (
  discoveredDevices: DiscoveredDevice[],
  knownDevices: KnownDevice[],
) => MatchedDevice[];

export type ConnectDeviceMapConnectionError<
  TConnectionError extends BaseConnectionError = BaseConnectionError,
> = (error: unknown) => TConnectionError;

export type ConnectDeviceStateMachineInput<
  TDiscoveryError extends BaseDiscoveryError = BaseDiscoveryError,
  TConnectionError extends BaseConnectionError = BaseConnectionError,
> = {
  knownDevices: Array<KnownDevice>;
  sessionId: string | null;
  dmk: DeviceManagementKit;
  deviceDiscoveryService: DeviceDiscoveryService<TDiscoveryError>;
  observer: Observer<ConnectDeviceUIState<TDiscoveryError, TConnectionError>>;
  onConnected: (result: DeviceConnectionResult) => void;
  buildCompatDeviceId?: (device: ConnectedDevice) => string;
  matchDiscoveredDevices: ConnectDeviceMatchDiscoveredDevices;
  mapConnectionError: ConnectDeviceMapConnectionError<TConnectionError>;
};

export type ConnectDeviceStateMachineContext<
  TDiscoveryError extends BaseDiscoveryError = BaseDiscoveryError,
  TConnectionError extends BaseConnectionError = BaseConnectionError,
> = ConnectDeviceStateMachineInput<TDiscoveryError, TConnectionError> & {
  matchedDevices: Array<MatchedDevice>;
  selectedKnownDevice: KnownDevice | null;
  selectedMatchedDevice: MatchedDevice | null;
  isDiscovering: boolean;
  discoveryError: TDiscoveryError | null;
  connectionError: TConnectionError | null;
  skipTransportIds: Array<TransportIdentifier>;
};

export enum ConnectDeviceStateMachineEventTypes {
  DiscoveryError = "discovery-error",
  DiscoveredNoDevice = "discovered-no-device",
  DiscoveredOneDevice = "discovered-one-device",
  DiscoveredManyDevices = "discovered-many-devices",
  UserTapsAvailableDevice = "user-taps-available-device",
  UserTapsUnavailableDevice = "user-taps-unavailable-device",
  UserTapsDiscoveryRetry = "user-taps-discovery-retry",
  UserTapsDiscoveryIgnore = "user-taps-discovery-ignore",
  UserTapsConnectionRetry = "user-taps-connection-retry",
  UserTapsConnectionIgnore = "user-taps-connection-ignore",
}

export type ConnectDeviceStateMachineEvent<
  TDiscoveryError extends BaseDiscoveryError = BaseDiscoveryError,
> =
  | {
      type: ConnectDeviceStateMachineEventTypes.DiscoveryError;
      error: TDiscoveryError;
    }
  | {
      type: ConnectDeviceStateMachineEventTypes.DiscoveredNoDevice;
    }
  | {
      type: ConnectDeviceStateMachineEventTypes.DiscoveredOneDevice;
      matchedDevices: Array<MatchedDevice>;
    }
  | {
      type: ConnectDeviceStateMachineEventTypes.DiscoveredManyDevices;
      matchedDevices: Array<MatchedDevice>;
    }
  | {
      type: ConnectDeviceStateMachineEventTypes.UserTapsAvailableDevice;
      matchedDevice: MatchedDevice;
    }
  | {
      type: ConnectDeviceStateMachineEventTypes.UserTapsUnavailableDevice;
      knownDevice: KnownDevice;
    }
  | {
      type: ConnectDeviceStateMachineEventTypes.UserTapsDiscoveryRetry;
    }
  | {
      type: ConnectDeviceStateMachineEventTypes.UserTapsDiscoveryIgnore;
    }
  | {
      type: ConnectDeviceStateMachineEventTypes.UserTapsConnectionRetry;
    }
  | {
      type: ConnectDeviceStateMachineEventTypes.UserTapsConnectionIgnore;
    };

/**
 * Includes the shared `ConnectivityUIStateTypes` members, so that connectDevice consumers can use
 * one object for every state. In type positions, use `typeof ConnectDeviceUIStateTypes.X`.
 */
export const ConnectDeviceUIStateTypes = {
  ...ConnectivityUIStateTypes,
  Loading: "loading",
  NoKnownDevice: "no-known-device",
  Discovering: "discovering",
  WaitingForSelectedDevice: "waiting-for-selected-device",
  Connecting: "connecting",
  Connected: "connected",
} as const;

export type ConnectDeviceUIStateType =
  (typeof ConnectDeviceUIStateTypes)[keyof typeof ConnectDeviceUIStateTypes];

export type ConnectDeviceUIState<
  TDiscoveryError extends BaseDiscoveryError = BaseDiscoveryError,
  TConnectionError extends BaseConnectionError = BaseConnectionError,
> =
  | {
      type: typeof ConnectDeviceUIStateTypes.Loading;
    }
  | {
      type: typeof ConnectDeviceUIStateTypes.NoKnownDevice;
    }
  | {
      type: typeof ConnectDeviceUIStateTypes.Discovering;
      devices: Array<DisplayedDevice>;
    }
  | {
      type: typeof ConnectDeviceUIStateTypes.WaitingForSelectedDevice;
      device: KnownDevice;
    }
  | {
      type: typeof ConnectDeviceUIStateTypes.Connecting;
      device: KnownDevice;
    }
  | {
      type: typeof ConnectDeviceUIStateTypes.Connected;
    }
  | DiscoveryErrorUIState<TDiscoveryError>
  | ConnectionErrorUIState<TConnectionError>
  | UnknownErrorUIState;
