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
  handleRetryOnIssue: (() => void) | null;
};

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
    `🧠 isHookEnabled: ${JSON.stringify({
      isAndroidBluetoothPermissionsHookEnabled,
      isAndroidLocationPermissionHookEnabled,
      isEnableBluetoothHookEnabled,
      isAndroidEnableLocationHookEnabled,
    })} `,
  );

  let bluetoothRequirementsState: BluetoothRequirementsState = "unknown";
  let handleRetryOnIssue = null;

  // Logic to determine the state of the bluetooth requirements, and the action to perform to retry
  if (
    isAndroidBluetoothPermissionsHookEnabled &&
    androidHasBluetoothPermissions === "denied"
  ) {
    bluetoothRequirementsState = "bluetooth_permissions_ungranted";
    handleRetryOnIssue = androidBluetoothPermissionsRequestForPermissionsAgain;
  } else if (
    isAndroidLocationPermissionHookEnabled &&
    androidHasLocationPermission === "denied"
  ) {
    bluetoothRequirementsState = "location_permission_ungranted";
    handleRetryOnIssue = androidLocationPermissionRequestForPermissionsAgain;
  } else if (
    isEnableBluetoothHookEnabled &&
    bluetoothServicesState === "disabled"
  ) {
    bluetoothRequirementsState = "bluetooth_disabled";
    handleRetryOnIssue = enableBluetoothCheckAndRequestAgain;
  } else if (
    isAndroidEnableLocationHookEnabled &&
    locationServicesState === "disabled"
  ) {
    bluetoothRequirementsState = "location_disabled";
    handleRetryOnIssue = androidEnableLocationCheckAndRequestAgain;
  }

  return {
    bluetoothRequirementsState,
    handleRetryOnIssue,
  };
};
