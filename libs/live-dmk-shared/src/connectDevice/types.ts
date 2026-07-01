import type {
  ConnectedDevice,
  DeviceManagementKit,
  DiscoveredDevice,
  TransportIdentifier,
} from "@ledgerhq/device-management-kit";
import type { DeviceModelId } from "@ledgerhq/types-devices";
import type { Observable, Observer } from "rxjs";

export type KnownDevice = {
  transport: TransportIdentifier;
  deviceModelId: DeviceModelId;
  id: string;
  name: string | null;
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
  discoveredDevices: Observable<DiscoveredDevice[]>;
  errors: Observable<TDiscoveryError>;
}

export type ConnectDeviceMatchDiscoveredDevices = (
  discoveredDevices: DiscoveredDevice[],
  knownDevices: KnownDevice[],
) => MatchedDevice[];

export type ConnectDeviceMapConnectionError<
  TConnectionError extends BaseConnectionError = BaseConnectionError,
> = (error: unknown) => TConnectionError;

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
  compatDeviceModelId: DeviceModelId;
  compatDeviceName: string;
  compatDeviceWired: boolean;
};

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

export enum ConnectDeviceUIStateTypes {
  Loading = "loading",
  NoKnownDevice = "no-known-device",
  Discovering = "discovering",
  DiscoveryError = "discovery-error",
  WaitingForSelectedDevice = "waiting-for-selected-device",
  Connecting = "connecting",
  ConnectionError = "connection-error",
  Connected = "connected",
  /**
   * Terminal state emitted by the use case when an unexpected error escapes the inner
   * state machine. Has no retry / ignore: the host UI is expected to display a generic
   * error and let the user dismiss the surrounding flow.
   */
  UnknownError = "unknown-error",
}

export type ConnectDeviceUIState<
  TDiscoveryError extends BaseDiscoveryError = BaseDiscoveryError,
  TConnectionError extends BaseConnectionError = BaseConnectionError,
> =
  | {
      type: ConnectDeviceUIStateTypes.Loading;
    }
  | {
      type: ConnectDeviceUIStateTypes.NoKnownDevice;
    }
  | {
      type: ConnectDeviceUIStateTypes.Discovering;
      devices: Array<DisplayedDevice>;
    }
  | {
      type: ConnectDeviceUIStateTypes.WaitingForSelectedDevice;
      device: KnownDevice;
    }
  | {
      type: ConnectDeviceUIStateTypes.DiscoveryError;
      error: TDiscoveryError;
      retry?: () => void;
      ignore: () => void;
    }
  | {
      type: ConnectDeviceUIStateTypes.Connecting;
      device: KnownDevice;
    }
  | {
      type: ConnectDeviceUIStateTypes.ConnectionError;
      error: TConnectionError;
      device: KnownDevice;
      retry: () => void;
      ignore: () => void;
    }
  | {
      type: ConnectDeviceUIStateTypes.Connected;
    }
  | {
      type: ConnectDeviceUIStateTypes.UnknownError;
      error: unknown;
    };
