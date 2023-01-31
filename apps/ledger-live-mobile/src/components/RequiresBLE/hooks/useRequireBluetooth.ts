import { Platform } from "react-native";

// import { useAndroidBluetoothPermissions } from "./useAndroidBluetoothPermissions";
import { useEnableBluetooth } from "./useEnableBluetooth";
// import { useAndroidLocationPermission } from "../../RequiresLocation/hooks/useAndroidLocationPermission";
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
 * Useful to enforce only bluetooth requirements.
 *
 * To use with RequiresBluetoothDrawer to display issues on specific requirements.
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
  console.log(`🧠 useRequireBluetooth: ${requiredFor} ${isHookEnabled}`);

  // const [bluetoothRequirementsState, setBluetoothRequirementsState] =
  //   useState<BluetoothRequirementsState>("unknown");

  // isAndroidLocationPermissionHookEnabled =
  //   isHookEnabled && requiredFor === "scanning" && Platform.OS === "android";

  // const {
  //   hasPermission: hasLocationPermission,
  //   neverAskAgain: neverAskAgainLocationPermission,
  //   requestForPermissionAgain: requestForLocationPermissionAgain,
  // } = useAndroidLocationPermission({
  //   isHookEnabled: isAndroidLocationPermissionHookEnabled,
  // });

  // const {
  //   hasPermissions: hasBluetoothPermissions,
  //   neverAskAgain: neverAskAgainBluetoothPermissions,
  //   requestForPermissionsAgain: requestForBluetoothPermissionsAgain,
  // } = useAndroidBluetoothPermissions();

  // TODO: the order is important

  // Handles bluetooth and location permissions first because there is more chance that the user enable/disable
  // a service during runtime than changing the permissions.
  // If the permissions are handled after, each time there is a change on the services enabling/disabling.
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

  // Handles location permission if necessary and once bluetooth permisions are granted
  const isAndroidLocationPermissionHookEnabled =
    isHookEnabled &&
    Platform.OS === "android" &&
    requiredFor === "scanning" &&
    androidHasBluetoothPermissions === "granted";

  const {
    hasPermission: androidHasLocationPermission,
    neverAskAgain: androidLocationPermissionNeverAskAgain,
    requestForPermissionAgain:
      androidLocationPermissionRequestForPermissionsAgain,
  } = useAndroidLocationPermission({
    isHookEnabled: isAndroidLocationPermissionHookEnabled,
  });

  // Handles bluetooth services once all necessary permissions are granted
  const isEnableBluetoothHookEnabled =
    isHookEnabled &&
    (Platform.OS === "ios" ||
      (androidHasBluetoothPermissions === "granted" &&
        (requiredFor === "connecting" ||
          androidHasLocationPermission === "granted")));

  // TODO: handle case of iOS and bluetooth permission
  const {
    bluetoothServicesState,
    checkAndRequestAgain: enableBluetoothCheckAndRequestAgain,
  } = useEnableBluetooth({
    isHookEnabled: isEnableBluetoothHookEnabled,
  });

  // Handles location services if necessary and once bluetooth is enabled
  const isAndroidEnableLocationHookEnabled =
    isHookEnabled &&
    requiredFor === "scanning" &&
    Platform.OS === "android" &&
    bluetoothServicesState === "enabled";

  const {
    locationServicesState,
    checkAndRequestAgain: androidEnableLocationCheckAndRequestAgain,
  } = useAndroidEnableLocation({
    isHookEnabled: isAndroidEnableLocationHookEnabled,
  });

  console.log(
    `🧠 androidBluetoothPermissionsNeverAskAgain: ${androidBluetoothPermissionsNeverAskAgain}`,
  );

  console.log(
    `🧠 isHookEnabled: ${JSON.stringify({
      isAndroidBluetoothPermissionsHookEnabled,
      isAndroidLocationPermissionHookEnabled,
      isEnableBluetoothHookEnabled,
      isAndroidEnableLocationHookEnabled,
    })} `,
  );

  let bluetoothRequirementsState: BluetoothRequirementsState = "unknown";
  let retryRequestOnIssue = null;
  let cannotRetryRequest = false;

  let someUnknown = false;

  // Logic to determine the state of the bluetooth requirements, and the action to perform to retry
  // Because we check if each hook is enabled, we don't need to respect a specific order of checks
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
    } else if (bluetoothServicesState !== "enabled") {
      someUnknown = true;
    }
  }

  if (isAndroidEnableLocationHookEnabled) {
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
    cannotRetryRequest,
  };
};
