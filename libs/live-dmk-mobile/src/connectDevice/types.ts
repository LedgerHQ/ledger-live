import type { TransportIdentifier } from "@ledgerhq/device-management-kit";
import type {
  ConnectDeviceUIState,
  DiscoveryErrorResolution,
  UnknownConnectionError,
  UnknownDiscoveryError,
} from "@ledgerhq/live-dmk-shared";

export {
  BaseConnectionErrorTypes,
  BaseDiscoveryErrorTypes,
  ConnectDeviceUIStateTypes,
} from "@ledgerhq/live-dmk-shared";

export enum ConnectionErrorTypes {
  BlePairingRefused = "ble-pairing-refused",
  BlePairingPeerRemovedPairing = "ble-pairing-peer-removed-pairing",
}

export type MobileConnectionError =
  | {
      type: ConnectionErrorTypes.BlePairingRefused;
    }
  | {
      type: ConnectionErrorTypes.BlePairingPeerRemovedPairing;
    }
  | UnknownConnectionError;

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
}

type MobileDiscoveryErrorResolution = DiscoveryErrorResolution<MobileDiscoveryError>;

type ResolvableDiscoveryError = {
  transportId: TransportIdentifier;
  resolution: MobileDiscoveryErrorResolution;
};

export type MobileDiscoveryError =
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
  /**
   * An unexpected discovery or preflight failure occurred.
   * UI should show a generic error and use `resolution.retry()` from a retry CTA when present.
   */
  | UnknownDiscoveryError;

export type MobileConnectDeviceUIState = ConnectDeviceUIState<
  MobileDiscoveryError,
  MobileConnectionError
>;
