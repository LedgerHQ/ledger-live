import type {
  ConnectedDevice,
  DeviceManagementKit,
  DiscoveredDevice,
} from "@ledgerhq/device-management-kit";
import type { DeviceModelId } from "@ledgerhq/types-devices";
import type { Observer } from "rxjs";

import type {
  ConnectNewDeviceFilterListedDevices,
  ConnectNewDeviceGetDiscoveredDeviceKey,
  EmbeddedConnectNewDeviceUIState,
} from "../connectNewDevice/types";
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
export type KnownDevice = Device & {
  /** Time of the last saved connection, in milliseconds since the epoch. */
  lastUsedAt?: number;
};

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

/**
 * What the embedded connectNewDevice state machine of the add flow needs. `null` turns the add flow
 * off: no state offers `addNewDevice`.
 */
export type ConnectDeviceConnectNewDeviceInput = {
  getDiscoveredDeviceKey: ConnectNewDeviceGetDiscoveredDeviceKey;
  filterListedDevices: ConnectNewDeviceFilterListedDevices;
};

/** The states that open the add flow, and that its back action returns to. */
export type ConnectDeviceAddNewDeviceOrigin =
  | "NoKnownDevice"
  | "Discovering"
  | "WaitingForSelectedDevice";

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
  /** Given to the embedded machine of the add flow, which lists only these device models. */
  acceptedDeviceModelIds?: Array<DeviceModelId>;
  connectNewDevice: ConnectDeviceConnectNewDeviceInput | null;
};

export type ConnectDeviceStateMachineContext<
  TDiscoveryError extends BaseDiscoveryError = BaseDiscoveryError,
  TConnectionError extends BaseConnectionError = BaseConnectionError,
> = ConnectDeviceStateMachineInput<TDiscoveryError, TConnectionError> & {
  matchedDevices: Array<MatchedDevice>;
  selectedKnownDevice: KnownDevice | null;
  selectedMatchedDevice: MatchedDevice | null;
  discoveryError: TDiscoveryError | null;
  connectionError: TConnectionError | null;
  showDeviceNotFound: boolean;
  addNewDeviceOrigin: ConnectDeviceAddNewDeviceOrigin | null;
  connectNewDeviceUIState: EmbeddedConnectNewDeviceUIState<
    TDiscoveryError,
    TConnectionError
  > | null;
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
  UserTapsAddNewDevice = "user-taps-add-new-device",
  UserTapsBack = "user-taps-back",
  ConnectNewDeviceUIStateChanged = "connect-new-device-ui-state-changed",
  NewDeviceConnected = "new-device-connected",
  ConnectNewDeviceFailed = "connect-new-device-failed",
}

export type ConnectDeviceStateMachineEvent<
  TDiscoveryError extends BaseDiscoveryError = BaseDiscoveryError,
  TConnectionError extends BaseConnectionError = BaseConnectionError,
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
    }
  | {
      type: ConnectDeviceStateMachineEventTypes.UserTapsAddNewDevice;
    }
  | {
      type: ConnectDeviceStateMachineEventTypes.UserTapsBack;
    }
  | {
      type: ConnectDeviceStateMachineEventTypes.ConnectNewDeviceUIStateChanged;
      uiState: EmbeddedConnectNewDeviceUIState<TDiscoveryError, TConnectionError>;
    }
  | {
      type: ConnectDeviceStateMachineEventTypes.NewDeviceConnected;
      result: DeviceConnectionResult;
    }
  | {
      type: ConnectDeviceStateMachineEventTypes.ConnectNewDeviceFailed;
      error: unknown;
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
  ConnectNewDevice: "connect-new-device",
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
      /** `null` when the add flow is off. */
      addNewDevice: (() => void) | null;
    }
  | {
      type: typeof ConnectDeviceUIStateTypes.Discovering;
      devices: Array<DisplayedDevice>;
      /** `null` when the add flow is off. */
      addNewDevice: (() => void) | null;
    }
  | {
      type: typeof ConnectDeviceUIStateTypes.WaitingForSelectedDevice;
      device: KnownDevice;
      /** Set after a delay, only when the add flow is on. The hint calls `addNewDevice`. */
      showDeviceNotFound: boolean;
      /** `null` when the add flow is off. */
      addNewDevice: (() => void) | null;
    }
  | {
      type: typeof ConnectDeviceUIStateTypes.ConnectNewDevice;
      connectNewDeviceUIState: EmbeddedConnectNewDeviceUIState<TDiscoveryError, TConnectionError>;
      /** Goes back to the state that opened the add flow. */
      back: () => void;
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
