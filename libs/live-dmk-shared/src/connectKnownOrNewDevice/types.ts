import type {
  ConnectedDevice,
  DeviceManagementKit,
  DiscoveredDevice,
} from "@ledgerhq/device-management-kit";
import type { Observable, Observer } from "rxjs";

import type { KnownDevice } from "../connectDevice/types";
import type {
  ConnectNewDeviceFilterListedDevices,
  ConnectNewDeviceGetDiscoveredDeviceKey,
  ConnectNewDeviceMapConnectionError,
  ConnectNewDeviceStateMachineInput,
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

/** Mock server devices take the connectivity that the mock server gives them. */
export type DeviceConnectivity = "BLE" | "USB";

export const DeviceListItemStatuses = {
  /** Known, but not discovered: turned off, locked or out of range. A USB device never has it. */
  Unavailable: "unavailable",
  /** Discovered, without a session. */
  Available: "available",
  /** Has a DMK session. Several devices can have it, known or not. */
  Connected: "connected",
} as const;

export type DeviceListItemStatus =
  (typeof DeviceListItemStatuses)[keyof typeof DeviceListItemStatuses];

/**
 * The list holds every connected device, every known BLE device and every discovered USB device.
 * A discovered device that matches a connected device shows once, as the connected device.
 */
export type DeviceListItem = {
  key: string;
  device: Device;
  connectivity: DeviceConnectivity;
  status: DeviceListItemStatus;
};

/**
 * `connect` on a connected device reuses its session. `remove` is only on a known BLE device: a USB
 * device stays in the list while it is plugged.
 */
export type SelectableDeviceListItem =
  | (DeviceListItem & {
      status: typeof DeviceListItemStatuses.Unavailable | typeof DeviceListItemStatuses.Available;
      connect: () => void;
      remove?: () => void;
    })
  | (DeviceListItem & {
      status: typeof DeviceListItemStatuses.Connected;
      connect: () => void;
      disconnect: () => void;
      remove?: () => void;
    });

export type ConnectKnownOrNewDeviceKnownDevice = KnownDevice & {
  /** Time of the last saved connection, in milliseconds since the epoch. */
  lastUsedAt?: number;
};

/** A candidate with an old default BLE name matches a device with the new one, not the reverse. */
export type ConnectKnownOrNewDeviceFindMatchingDevice = <TCandidate extends Device>(
  device: Device,
  candidates: Array<TCandidate>,
) => TCandidate | null;

/** Called for the devices whose connection type does not tell BLE or USB. */
export type ConnectKnownOrNewDeviceGetConnectivity = (device: Device) => DeviceConnectivity;

export type ConnectKnownOrNewDeviceOnConnected = (
  result: DeviceConnectionResult,
  options: { isNewDevice: boolean },
) => void;

export type ConnectKnownOrNewDeviceDelays = {
  /** Before WaitingForDevice shows the hint that opens the Add mode. */
  deviceNotFoundDelay?: number;
  connectNewDevice?: Pick<
    ConnectNewDeviceStateMachineInput,
    "deviceNotFoundDelay" | "successDelay"
  >;
};

export type ConnectKnownOrNewDeviceStateMachineInput<
  TDiscoveryError extends BaseDiscoveryError = BaseDiscoveryError,
  TConnectionError extends BaseConnectionError = BaseConnectionError,
> = {
  dmk: DeviceManagementKit;
  /** Shared with the embedded connectNewDevice state machine of the Add mode. */
  deviceDiscoveryService: DeviceDiscoveryService<TDiscoveryError>;
  observer: Observer<ConnectKnownOrNewDeviceUIState<TDiscoveryError, TConnectionError>>;
  knownDevices$: Observable<Array<ConnectKnownOrNewDeviceKnownDevice>>;
  connectedDevices$: Observable<Array<ConnectedDevice>>;
  findMatchingDevice: ConnectKnownOrNewDeviceFindMatchingDevice;
  getConnectivity: ConnectKnownOrNewDeviceGetConnectivity;
  removeKnownDevice: (knownDevice: ConnectKnownOrNewDeviceKnownDevice) => void;
  mapConnectionError: ConnectNewDeviceMapConnectionError<TConnectionError>;
  onConnected: ConnectKnownOrNewDeviceOnConnected;
  getDiscoveredDeviceKey: ConnectNewDeviceGetDiscoveredDeviceKey;
  filterListedDevices?: ConnectNewDeviceFilterListedDevices;
  buildCompatDeviceId?: (device: ConnectedDevice) => string;
  isPaused?: boolean;
  delays?: ConnectKnownOrNewDeviceDelays;
};

/** A device list item with the devices that the machine connects, disconnects or removes. */
export type DeviceListEntry = DeviceListItem & {
  knownDevice: ConnectKnownOrNewDeviceKnownDevice | null;
  connectedDevice: ConnectedDevice | null;
  discoveredDevice: DiscoveredDevice | null;
};

export type ConnectKnownOrNewDeviceStateMachineContext<
  TDiscoveryError extends BaseDiscoveryError = BaseDiscoveryError,
  TConnectionError extends BaseConnectionError = BaseConnectionError,
> = Omit<
  ConnectKnownOrNewDeviceStateMachineInput<TDiscoveryError, TConnectionError>,
  "knownDevices$" | "connectedDevices$" | "isPaused" | "delays"
> & {
  deviceNotFoundDelay: number;
  connectNewDeviceDelays: ConnectKnownOrNewDeviceDelays["connectNewDevice"];
  isPaused: boolean;
  knownDevices: Array<ConnectKnownOrNewDeviceKnownDevice>;
  connectedDevices: Array<ConnectedDevice>;
  discoveredDevices: Array<DiscoveredDevice>;
  deviceList: Array<DeviceListEntry>;
  selectedEntry: DeviceListEntry | null;
  showDeviceNotFound: boolean;
  transportIdsToIgnore: Array<NonNullable<BaseDiscoveryError["transportId"]>>;
  discoveryError: TDiscoveryError | null;
  connectionError: TConnectionError | null;
  connectNewDeviceUIState: EmbeddedConnectNewDeviceUIState<
    TDiscoveryError,
    TConnectionError
  > | null;
};

export enum ConnectKnownOrNewDeviceStateMachineEventTypes {
  KnownDevicesChanged = "known-devices-changed",
  ConnectedDevicesChanged = "connected-devices-changed",
  DevicesDiscovered = "devices-discovered",
  DiscoveryError = "discovery-error",
  Pause = "pause",
  Resume = "resume",
  UserTapsDevice = "user-taps-device",
  UserTapsDisconnectDevice = "user-taps-disconnect-device",
  UserTapsRemoveDevice = "user-taps-remove-device",
  UserTapsAddNewDevice = "user-taps-add-new-device",
  UserClosesWaitingForDevice = "user-closes-waiting-for-device",
  UserClosesConnecting = "user-closes-connecting",
  UserClosesConnectNewDevice = "user-closes-connect-new-device",
  UserTapsDiscoveryRetry = "user-taps-discovery-retry",
  UserTapsDiscoveryIgnore = "user-taps-discovery-ignore",
  UserClosesDiscoveryError = "user-closes-discovery-error",
  UserTapsConnectionRetry = "user-taps-connection-retry",
  UserTapsConnectionIgnore = "user-taps-connection-ignore",
  UserClosesConnectionError = "user-closes-connection-error",
  ConnectNewDeviceUIStateChanged = "connect-new-device-ui-state-changed",
  NewDeviceConnected = "new-device-connected",
  ConnectNewDeviceFailed = "connect-new-device-failed",
}

export type ConnectKnownOrNewDeviceStateMachineEvent<
  TDiscoveryError extends BaseDiscoveryError = BaseDiscoveryError,
  TConnectionError extends BaseConnectionError = BaseConnectionError,
> =
  | {
      type: ConnectKnownOrNewDeviceStateMachineEventTypes.KnownDevicesChanged;
      knownDevices: Array<ConnectKnownOrNewDeviceKnownDevice>;
    }
  | {
      type: ConnectKnownOrNewDeviceStateMachineEventTypes.ConnectedDevicesChanged;
      connectedDevices: Array<ConnectedDevice>;
    }
  | {
      type: ConnectKnownOrNewDeviceStateMachineEventTypes.DevicesDiscovered;
      discoveredDevices: Array<DiscoveredDevice>;
    }
  | {
      type: ConnectKnownOrNewDeviceStateMachineEventTypes.DiscoveryError;
      error: TDiscoveryError;
    }
  | {
      type:
        | ConnectKnownOrNewDeviceStateMachineEventTypes.UserTapsDevice
        | ConnectKnownOrNewDeviceStateMachineEventTypes.UserTapsDisconnectDevice
        | ConnectKnownOrNewDeviceStateMachineEventTypes.UserTapsRemoveDevice;
      key: string;
    }
  | {
      type: ConnectKnownOrNewDeviceStateMachineEventTypes.ConnectNewDeviceUIStateChanged;
      uiState: EmbeddedConnectNewDeviceUIState<TDiscoveryError, TConnectionError>;
    }
  | {
      type: ConnectKnownOrNewDeviceStateMachineEventTypes.NewDeviceConnected;
      result: DeviceConnectionResult;
    }
  | {
      type: ConnectKnownOrNewDeviceStateMachineEventTypes.ConnectNewDeviceFailed;
      error: unknown;
    }
  | {
      type:
        | ConnectKnownOrNewDeviceStateMachineEventTypes.Pause
        | ConnectKnownOrNewDeviceStateMachineEventTypes.Resume
        | ConnectKnownOrNewDeviceStateMachineEventTypes.UserTapsAddNewDevice
        | ConnectKnownOrNewDeviceStateMachineEventTypes.UserClosesWaitingForDevice
        | ConnectKnownOrNewDeviceStateMachineEventTypes.UserClosesConnecting
        | ConnectKnownOrNewDeviceStateMachineEventTypes.UserClosesConnectNewDevice
        | ConnectKnownOrNewDeviceStateMachineEventTypes.UserTapsDiscoveryRetry
        | ConnectKnownOrNewDeviceStateMachineEventTypes.UserTapsDiscoveryIgnore
        | ConnectKnownOrNewDeviceStateMachineEventTypes.UserClosesDiscoveryError
        | ConnectKnownOrNewDeviceStateMachineEventTypes.UserTapsConnectionRetry
        | ConnectKnownOrNewDeviceStateMachineEventTypes.UserTapsConnectionIgnore
        | ConnectKnownOrNewDeviceStateMachineEventTypes.UserClosesConnectionError;
    };

/**
 * Includes the shared `ConnectivityUIStateTypes` members, so that connectKnownOrNewDevice consumers
 * can use one object for every state. In type positions, use
 * `typeof ConnectKnownOrNewDeviceUIStateTypes.X`.
 */
export const ConnectKnownOrNewDeviceUIStateTypes = {
  ...ConnectivityUIStateTypes,
  Discovering: "discovering",
  WaitingForDevice: "waiting-for-device",
  Connecting: "connecting",
  ConnectNewDevice: "connect-new-device",
} as const;

export type ConnectKnownOrNewDeviceUIStateType =
  (typeof ConnectKnownOrNewDeviceUIStateTypes)[keyof typeof ConnectKnownOrNewDeviceUIStateTypes];

type WithDeviceList = {
  devices: Array<DeviceListItem>;
};

export type ConnectKnownOrNewDeviceUIState<
  TDiscoveryError extends BaseDiscoveryError = BaseDiscoveryError,
  TConnectionError extends BaseConnectionError = BaseConnectionError,
> =
  | {
      type: typeof ConnectKnownOrNewDeviceUIStateTypes.Discovering;
      devices: Array<SelectableDeviceListItem>;
      addNewDevice: () => void;
    }
  | (WithDeviceList & {
      type: typeof ConnectKnownOrNewDeviceUIStateTypes.WaitingForDevice;
      device: Device;
      /** Set after a delay. The hint calls `addNewDevice`. */
      showDeviceNotFound: boolean;
      addNewDevice: () => void;
      close: () => void;
    })
  | (WithDeviceList & {
      type: typeof ConnectKnownOrNewDeviceUIStateTypes.Connecting;
      device: Device;
      close: () => void;
    })
  | {
      type: typeof ConnectKnownOrNewDeviceUIStateTypes.ConnectNewDevice;
      connectNewDeviceUIState: EmbeddedConnectNewDeviceUIState<TDiscoveryError, TConnectionError>;
      close: () => void;
    }
  | (WithDeviceList & DiscoveryErrorUIState<TDiscoveryError> & { close: () => void })
  | (WithDeviceList & ConnectionErrorUIState<TConnectionError> & { close: () => void })
  | UnknownErrorUIState;
