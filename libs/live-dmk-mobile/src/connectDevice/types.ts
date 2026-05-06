import type {
  ConnectedDevice,
  DeviceManagementKit,
  DiscoveredDevice,
  TransportIdentifier,
} from "@ledgerhq/device-management-kit";
import type { KnownDevice } from "@ledgerhq/live-dmk-shared";
import type { DeviceModelId } from "@ledgerhq/types-devices";
import type { Observable, Observer } from "rxjs";


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

export enum ConnectionErrorTypes {
  BlePairingRefused = "ble-pairing-refused",
  BlePairingPeerRemovedPairing = "ble-pairing-peer-removed-pairing",
  Unknown = "unknown",
}

export type ConnectionError =
  | {
      type: ConnectionErrorTypes.BlePairingRefused;
    }
  | {
      type: ConnectionErrorTypes.BlePairingPeerRemovedPairing;
    }
  | {
      type: ConnectionErrorTypes.Unknown;
      error?: unknown;
    };

export enum DiscoveryErrorTypes {
  /**
   * Android Bluetooth runtime permissions are denied but can be requested again.
   * Concerned permissions: `BLUETOOTH_SCAN` and `BLUETOOTH_CONNECT` on Android 12+ (API >= 31).
   * UI should show Bluetooth permission instructions and call `resolution.retry()` only when the user
   * presses a retry CTA to re-prompt.
   */
  BluetoothPermissionDeniedPromptable = "bluetooth-permission-denied-promptable",
  /**
   * Android Bluetooth runtime permissions are denied and cannot be re-prompted from the app.
   * Concerned permissions: `BLUETOOTH_SCAN` and `BLUETOOTH_CONNECT` on Android 12+ (API >= 31).
   * UI should explain how to enable the permissions manually in system settings. If the user presses
   * a retry CTA after returning, call `resolution.retry()` only to re-check.
   */
  BluetoothPermissionDeniedManualSettings = "bluetooth-permission-denied-manual-settings",
  /**
   * The OS reports Bluetooth access as unauthorized, typically on iOS.
   * UI should direct the user to system settings because the app cannot show the permission prompt again.
   */
  BluetoothPermissionUnauthorizedManualSettings = "bluetooth-permission-unauthorized-manual-settings",
  /**
   * Bluetooth is disabled and the platform can show a native enable prompt.
   * UI should show a Bluetooth disabled message and call `resolution.retry()` only when the user
   * presses a retry CTA to trigger the prompt again.
   */
  BluetoothDisabledPromptable = "bluetooth-disabled-promptable",
  /**
   * Bluetooth is disabled but cannot be enabled through an in-app prompt.
   * UI should ask the user to enable Bluetooth manually. If the user presses a retry CTA after doing
   * so, call `resolution.retry()` to re-check.
   */
  BluetoothDisabledManualAction = "bluetooth-disabled-manual-action",
  /**
   * Bluetooth is in an indeterminate state such as Unknown or Resetting.
   * UI should show a transient/check-again state and call `resolution.retry()` only when the user
   * presses a retry CTA to re-run the check.
   */
  BluetoothStateUnknownCheckOnly = "bluetooth-state-unknown-check-only",
  /**
   * The device or platform does not support BLE.
   * UI should show a non-recoverable unsupported-device message and should not offer retry as a fix.
   */
  BluetoothUnsupported = "bluetooth-unsupported",
  /**
   * Android location permission is required for BLE scanning and can be requested again.
   * Concerned permission: `ACCESS_COARSE_LOCATION` on Android 9 and below (API <= 28), or
   * `ACCESS_FINE_LOCATION` on Android 10 and 11 (API 29-30).
   * UI should show location permission instructions and call `resolution.retry()` only when the user
   * presses a retry CTA to re-prompt.
   */
  LocationPermissionDeniedPromptable = "location-permission-denied-promptable",
  /**
   * Android location permission is required for BLE scanning but cannot be re-prompted from the app.
   * Concerned permission: `ACCESS_COARSE_LOCATION` on Android 9 and below (API <= 28), or
   * `ACCESS_FINE_LOCATION` on Android 10 and 11 (API 29-30).
   * UI should explain how to enable the permission manually in settings. If the user presses a retry
   * CTA after returning, call `resolution.retry()` only to re-check.
   */
  LocationPermissionDeniedManualSettings = "location-permission-denied-manual-settings",
  /**
   * Android location services are disabled and the platform can show a native enable prompt.
   * UI should show a location services disabled message and call `resolution.retry()` only when the
   * user presses a retry CTA to trigger the prompt.
   */
  LocationDisabledPromptable = "location-disabled-promptable",
  /**
   * Android location services are disabled but cannot be enabled through an in-app prompt.
   * UI should ask the user to enable location services manually. If the user presses a retry CTA after
   * doing so, call `resolution.retry()` to re-check.
   */
  LocationDisabledManualAction = "location-disabled-manual-action",
  /**
   * Android location services cannot be checked because location permission is missing unexpectedly.
   * UI should route the user back to the location permission instructions, or call `resolution.retry()`
   * from a retry CTA to re-run the full preflight.
   */
  LocationServicePermissionMissing = "location-service-permission-missing",
  /**
   * An unexpected discovery or preflight failure occurred.
   * UI should show a generic error and use `resolution.retry()` from a retry CTA when present.
   */
  Unknown = "unknown",
}

export type DiscoveryErrorResolution = {
  type: "prompt";
  retry: () => Promise<true | DiscoveryError>;
} | {
  type: "manual-action";
  retry: () => Promise<true | DiscoveryError>;
} | {
  type: "check-only";
  retry: () => Promise<true | DiscoveryError>;
} | {
  type: "none";
};

type ResolvableDiscoveryError = {
  transportId: TransportIdentifier;
  resolution: DiscoveryErrorResolution;
};

export type DiscoveryError =
  | ({
      type: DiscoveryErrorTypes.BluetoothPermissionDeniedPromptable;
      permissions: string[];
    } & ResolvableDiscoveryError)
  | ({
      type: DiscoveryErrorTypes.BluetoothPermissionDeniedManualSettings;
      permissions: string[];
    } & ResolvableDiscoveryError)
  | ({
      type: DiscoveryErrorTypes.BluetoothPermissionUnauthorizedManualSettings;
    } & ResolvableDiscoveryError)
  | ({
      type: DiscoveryErrorTypes.BluetoothDisabledPromptable;
    } & ResolvableDiscoveryError)
  | ({
      type: DiscoveryErrorTypes.BluetoothDisabledManualAction;
      error?: unknown;
    } & ResolvableDiscoveryError)
  | ({
      type: DiscoveryErrorTypes.BluetoothStateUnknownCheckOnly;
      state?: string;
    } & ResolvableDiscoveryError)
  | ({
      type: DiscoveryErrorTypes.BluetoothUnsupported;
    } & ResolvableDiscoveryError)
  | ({
      type: DiscoveryErrorTypes.LocationPermissionDeniedPromptable;
      permission: string;
    } & ResolvableDiscoveryError)
  | ({
      type: DiscoveryErrorTypes.LocationPermissionDeniedManualSettings;
      permission: string;
    } & ResolvableDiscoveryError)
  | ({
      type: DiscoveryErrorTypes.LocationDisabledPromptable;
    } & ResolvableDiscoveryError)
  | ({
      type: DiscoveryErrorTypes.LocationDisabledManualAction;
      error?: unknown;
    } & ResolvableDiscoveryError)
  | ({
      type: DiscoveryErrorTypes.LocationServicePermissionMissing;
    } & ResolvableDiscoveryError)
  | {
      type: DiscoveryErrorTypes.Unknown;
      transportId?: TransportIdentifier;
      resolution?: DiscoveryErrorResolution;
      error?: unknown;
    };

export type DeviceDiscoveryStartArgs = {
  ignoreTransportIdentifiers?: Array<TransportIdentifier>;
};

export interface DeviceDiscoveryService {
  start(args: DeviceDiscoveryStartArgs): void;
  stop(): void;
  discoveredDevices: Observable<DiscoveredDevice[]>;
  errors: Observable<DiscoveryError>;
}

export type ConnectDeviceConnectionService = {
  connect: DeviceManagementKit["connect"];
};

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

export type ConnectDeviceStateMachineInput = {
  knownDevices: Array<KnownDevice>;
  sessionId: string | null;
  dmk: DeviceManagementKit;
  deviceDiscoveryService: DeviceDiscoveryService;
  observer: Observer<ConnectDeviceUIState>;
  onConnected: (result: DeviceConnectionResult) => void;
};

export type ConnectDeviceStateMachineContext = ConnectDeviceStateMachineInput & {
  matchedDevices: Array<MatchedDevice>;
  selectedKnownDevice: KnownDevice | null;
  selectedMatchedDevice: MatchedDevice | null;
  isDiscovering: boolean;
  discoveryError: DiscoveryError | null;
  connectionError: ConnectionError | null;
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

export type ConnectDeviceStateMachineEvent =
  | {
      type: ConnectDeviceStateMachineEventTypes.DiscoveryError;
      error: DiscoveryError;
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
}

export type ConnectDeviceUIState =
    {
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
      error: DiscoveryError;
      retry?: () => void;
      ignore: () => void;
    }
  | {
      type: ConnectDeviceUIStateTypes.Connecting;
    }
  | {
      type: ConnectDeviceUIStateTypes.ConnectionError;
      error: ConnectionError;
      retry: () => void;
      ignore: () => void;
    }
  | {
      type: ConnectDeviceUIStateTypes.Connected;
    };
