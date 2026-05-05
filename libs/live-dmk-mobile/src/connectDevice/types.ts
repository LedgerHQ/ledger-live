import type { DiscoveredDevice } from "@ledgerhq/device-management-kit";
import type { DeviceModelId } from "@ledgerhq/types-devices";
import type { Observable } from "rxjs";

export type KnownDevice = {
  transport: "USB" | "BLE" | "SPECULOS" | "OTHER";
  deviceModelId: DeviceModelId;
  id: string;
  name: string;
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

export enum ConnectionErrorType {
  BlePairingRefused = "ble-pairing-refused",
  BlePairingPeerRemovedPairing = "ble-pairing-peer-removed-pairing",
}

export type ConnectionError =
  | {
      type: ConnectionErrorType.BlePairingRefused;
    }
  | {
      type: ConnectionErrorType.BlePairingPeerRemovedPairing;
    };

export enum DiscoveryErrors {
  BleNotEnabled = "ble-not-enabled",
  PermissionMissing = "permission-missing",
  Unknown = "unknown",
}

// TODO: more errors possible
export type DiscoveryError =
  | {
      type: DiscoveryErrors.BleNotEnabled;
      transportID: string;
      retry: () => Promise<true | DiscoveryError>;
    }
  | {
      type: DiscoveryErrors.PermissionMissing;
      transportID: string;
      retry: () => Promise<true | DiscoveryError>;
    }
  | {
      type: DiscoveryErrors.Unknown;
      transportID?: string;
      retry?: () => Promise<true | DiscoveryError>;
      error?: unknown;
    };

export enum UIStateType {
  NoKnownDevice = "no-known-device",
  Discovering = "discovering",
  DiscoveryError = "discovery-error",
  ManyDevicesAvailable = "many-devices-available",
  WaitingForSelectedDevice = "waiting-for-selected-device",
  Connecting = "connecting",
  ConnectionError = "connection-error",
  Connected = "connected",
}

export type ConnectDeviceUIState =
  | {
      type: UIStateType.NoKnownDevice;
    }
  | {
      type: UIStateType.Discovering;
      devices: Array<DisplayedDevice>;
    }
  | {
      type: UIStateType.ManyDevicesAvailable;
      devices: Array<DisplayedDevice>;
    }
  | {
      type: UIStateType.WaitingForSelectedDevice;
      device: DisplayedDevice;
    }
  | {
      type: UIStateType.DiscoveryError;
      error: DiscoveryError;
    }
  | {
      type: UIStateType.Connecting;
    }
  | {
      type: UIStateType.ConnectionError;
      error: ConnectionError;
    }
  | {
      type: UIStateType.Connected;
    };

export interface DeviceDiscoveryService {
  start(): void;
  stop(): void;
  discoveredDevices: Observable<DiscoveredDevice[]>;
  errors: Observable<DiscoveryError>;
}

export enum StateMachineEventsTypes {
  DISCOVERED_NO_DEVICE = "DISCOVERED_NO_DEVICE",
  DISCOVERED_ONE_DEVICE = "DISCOVERED_ONE_DEVICE",
  DISCOVERED_MANY_DEVICES = "DISCOVERED_MANY_DEVICES",
}

export type StateMachineEvent =
  | {
      type: StateMachineEventsTypes.DISCOVERED_NO_DEVICE;
    }
  | {
      type: StateMachineEventsTypes.DISCOVERED_ONE_DEVICE;
      matchedDevices: Array<MatchedDevice>;
    }
  | {
      type: StateMachineEventsTypes.DISCOVERED_MANY_DEVICES;
      matchedDevices: Array<MatchedDevice>;
    };
