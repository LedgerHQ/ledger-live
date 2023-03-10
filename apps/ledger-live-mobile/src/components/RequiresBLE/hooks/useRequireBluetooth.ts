import { useEffect, useState } from "react";
import { Platform } from "react-native";
import { useEnableBluetooth } from "./useEnableBluetooth";
import { useAndroidEnableLocation } from "../../RequiresLocation/hooks/useAndroidEnableLocation";
import { useAndroidBluetoothPermissions } from "./useAndroidBluetoothPermissions";
import { useAndroidLocationPermission } from "../../RequiresLocation/hooks/useAndroidLocationPermission";

export type BluetoothRequirementsState =
  | "unknown"
  | "bluetooth_disabled"
  | "location_disabled"
  | "bluetooth_permissions_ungranted"
  | "location_permission_ungranted"
  | "all_respected";

export type UseRequireBluetoothArgs = {
  requiredFor: "scanning" | "connecting";
  isHookEnabled?: boolean;
};

export type UseRequireBluetoothOutput = {
  bluetoothRequirementsState: BluetoothRequirementsState;
  retryRequestOnIssue: (() => void) | null;
  cannotRetryRequest: boolean;
};

/**
 * Handles the logic making sure all bluetooth requirements are respected depending on the usage and the user OS.
 *
 * Use useDebouncedRequireBluetooth defined below to avoid UI glitches.
 *
 * Useful to enforce only bluetooth requirements.
 *
 * To use with RequiresBluetoothDrawer to display issues on specific requirements.
 *
 * Order: for better UX: handles bluetooth permissions + services enabled first,
 * then location (if necessary) permissions and services enabled
 *
 * @param requiredFor The usage of bluetooth. Can be "scanning" or "connecting".
 * @param isHookEnabled Whether the the processes to check and request for bluetooth requirements should be enabled or not.
 *   Useful to disable the hook when the user does not need bluetooth yet.
 * @returns an object containing:
 * - bluetoothRequirementsState: the state of the bluetooth requirements.
 * - retryRequestOnIssue: a function to retry the process to check/request for the currently failed bluetooth requirement.
 * - cannotRetryRequest: whether the consumer of this hook can use the retry function retryRequestOnIssue.
 *   For example, for permissions on Android, it is only possible to retry to request directly the user (and not make them
 *   go to the settings) if the user has not checked/triggered the "never ask again".
 */
export const useRequireBluetooth = ({
  requiredFor,
  isHookEnabled = true,
}: UseRequireBluetoothArgs): UseRequireBluetoothOutput => {
  // Only handles bluetooth permissions for Android. For iOS, directly handled with useEnableBluetooth
  const isAndroidBluetoothPermissionsHookEnabled =
    isHookEnabled && Platform.OS === "android";

  const {
    hasPermissions: androidHasBluetoothPermissions,
    neverAskAgain: androidBluetoothPermissionsNeverAskAgain,
    requestForPermissionsAgain:
      androidBluetoothPermissionsRequestForPermissionsAgain,
  } = useAndroidBluetoothPermissions({
    isHookEnabled: isAndroidBluetoothPermissionsHookEnabled,
  });

  // Handles bluetooth services once bluetooth permissions are granted for Android, or directly for iOS
  const isEnableBluetoothHookEnabled =
    isHookEnabled &&
    (Platform.OS === "ios" || androidHasBluetoothPermissions === "granted");

  const {
    bluetoothServicesState,
    checkAndRequestAgain: enableBluetoothCheckAndRequestAgain,
  } = useEnableBluetooth({
    isHookEnabled: isEnableBluetoothHookEnabled,
  });

  // Handles location permission on Android if necessary and once bluetooth permisions are granted and bluetooth services are enabled
  const isAndroidLocationPermissionHookEnabled =
    isHookEnabled &&
    Platform.OS === "android" &&
    requiredFor === "scanning" &&
    androidHasBluetoothPermissions === "granted" &&
    bluetoothServicesState === "enabled";

  const {
    hasPermission: androidHasLocationPermission,
    neverAskAgain: androidLocationPermissionNeverAskAgain,
    requestForPermissionAgain:
      androidLocationPermissionRequestForPermissionsAgain,
  } = useAndroidLocationPermission({
    isHookEnabled: isAndroidLocationPermissionHookEnabled,
  });

  // Handles location services on Android if necessary and once bluetooth permisions are granted and bluetooth services are enabled
  // and location permission is granted
  const isAndroidEnableLocationHookEnabled =
    isHookEnabled &&
    Platform.OS === "android" &&
    requiredFor === "scanning" &&
    androidHasBluetoothPermissions === "granted" &&
    bluetoothServicesState === "enabled" &&
    androidHasLocationPermission === "granted";

  const {
    locationServicesState,
    checkAndRequestAgain: androidEnableLocationCheckAndRequestAgain,
  } = useAndroidEnableLocation({
    isHookEnabled: isAndroidEnableLocationHookEnabled,
  });

  let bluetoothRequirementsState: BluetoothRequirementsState = "unknown";
  let retryRequestOnIssue = null;
  let cannotRetryRequest = false;

  let someUnknown = false;

  // Logic to determine the state of the bluetooth requirements, and the action to perform to retry
  // Because we check if each hook is enabled, we don't need to respect a specific order for the checks
  if (isAndroidBluetoothPermissionsHookEnabled) {
    if (androidHasBluetoothPermissions === "denied") {
      bluetoothRequirementsState = "bluetooth_permissions_ungranted";
      retryRequestOnIssue =
        androidBluetoothPermissionsRequestForPermissionsAgain;
      cannotRetryRequest = androidBluetoothPermissionsNeverAskAgain;
    } else if (androidHasBluetoothPermissions !== "granted") {
      someUnknown = true;
    }
  }

  if (isAndroidLocationPermissionHookEnabled) {
    if (androidHasLocationPermission === "denied") {
      bluetoothRequirementsState = "location_permission_ungranted";
      retryRequestOnIssue = androidLocationPermissionRequestForPermissionsAgain;
      cannotRetryRequest = androidLocationPermissionNeverAskAgain;
    } else if (androidHasLocationPermission !== "granted") {
      someUnknown = true;
    }
  }

  if (isEnableBluetoothHookEnabled) {
    if (bluetoothServicesState === "disabled") {
      bluetoothRequirementsState = "bluetooth_disabled";
      retryRequestOnIssue = enableBluetoothCheckAndRequestAgain;
    }
    // Happens on iOS when user did not grant bluetooth permissions
    // No retry function on iOS because there is currently no way to request bluetooth permissions directly
    else if (bluetoothServicesState === "unauthorized") {
      bluetoothRequirementsState = "bluetooth_permissions_ungranted";
      cannotRetryRequest = true;
    } else if (bluetoothServicesState !== "enabled") {
      someUnknown = true;
    }
  }

  if (isAndroidEnableLocationHookEnabled && !retryRequestOnIssue) {
    if (locationServicesState === "disabled") {
      bluetoothRequirementsState = "location_disabled";
      retryRequestOnIssue = androidEnableLocationCheckAndRequestAgain;
    } else if (locationServicesState !== "enabled") {
      someUnknown = true;
    }
  }

  if (
    isHookEnabled &&
    !someUnknown &&
    bluetoothRequirementsState === "unknown"
  ) {
    bluetoothRequirementsState = "all_respected";
  }

  return {
    bluetoothRequirementsState,
    retryRequestOnIssue,
    cannotRetryRequest: cannotRetryRequest || !retryRequestOnIssue,
  };
};

const DEFAULT_DEBOUNCE_MS = 500;

/**
 * Debounced version of useRequireBluetooth.
 * Handles the logic making sure all bluetooth requirements are respected depending on the usage and the user OS.
 *
 * To avoid UI glitches prefer this hook and not directly useRequireBluetooth.
 * To use with RequiresBluetoothDrawer to display issues on specific requirements.
 *
 * The UI glitch can happen because of the native popups that block React from updating the state.
 * For example for a requirement A (bluetooth service for ex): the state `bluetoothRequirementsState` starts from “unknown”,
 * then a native popup is displayed, blocking react to update the states, and then if the user enables the requirement
 * from the native popup, the state goes to “A_not_respected” and just after to “A_respected”.
 *
 * Order: for better UX: handles bluetooth permissions + services enabled first,
 * then location (if necessary) permissions and services enabled
 *
 * @param requiredFor The usage of bluetooth. Can be "scanning" or "connecting".
 * @param isHookEnabled Whether the the processes to check and request for bluetooth requirements should be enabled or not.
 *   Useful to disable the hook when the user does not need bluetooth yet.
 * @param debounceTimeMs The debounce time in ms, default to DEFAULT_DEBOUNCE_MS
 * @returns an object containing:
 * - bluetoothRequirementsState: the state of the bluetooth requirements.
 * - retryRequestOnIssue: a function to retry the process to check/request for the currently failed bluetooth requirement.
 * - cannotRetryRequest: whether the consumer of this hook can use the retry function retryRequestOnIssue.
 *   For example, for permissions on Android, it is only possible to retry to request directly the user (and not make them
 *   go to the settings) if the user has not checked/triggered the "never ask again".
 */
export const useDebouncedRequireBluetooth = ({
  requiredFor,
  isHookEnabled = true,
  debounceTimeMs = DEFAULT_DEBOUNCE_MS,
}: UseRequireBluetoothArgs & {
  debounceTimeMs?: number;
}): UseRequireBluetoothOutput => {
  const [debouncedState, setDebouncedState] =
    useState<BluetoothRequirementsState>("unknown");

  const {
    bluetoothRequirementsState,
    retryRequestOnIssue,
    cannotRetryRequest,
  } = useRequireBluetooth({ requiredFor, isHookEnabled });

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedState(bluetoothRequirementsState);
    }, debounceTimeMs);

    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [bluetoothRequirementsState, debounceTimeMs]);

  return {
    bluetoothRequirementsState: debouncedState,
    retryRequestOnIssue,
    cannotRetryRequest,
  };
};
