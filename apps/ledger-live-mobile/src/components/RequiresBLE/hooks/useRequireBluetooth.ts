import { Platform } from "react-native";

// import { useAndroidBluetoothPermissions } from "./useAndroidBluetoothPermissions";
import { useEnableBluetooth } from "./useEnableBluetooth";
// import { useAndroidLocationPermission } from "../../RequiresLocation/hooks/useAndroidLocationPermission";
import { useAndroidEnableLocation } from "../../RequiresLocation/hooks/useAndroidEnableLocation";
import { useAndroidBluetoothPermissions } from "./useAndroidBluetoothPermissions";

export type BluetoothRequirementsState =
  | "unknown"
  | "bluetooth disabled"
  | "location disabled"
  | "bluetooth permissions ungranted"
  | "location permissions ungranted"
  | "all respected";

export type UseRequireBluetoothArgs = {
  isHookEnabled?: boolean;
  type?: "scanning" | "connecting";
};

export type UseRequireBluetoothOutput = {
  bluetoothRequirementsState: BluetoothRequirementsState;
  handleRetryOnIssue: (() => void) | null;
};

export const useRequireBluetooth = ({
  type = "scanning",
  isHookEnabled = true,
}: UseRequireBluetoothArgs): UseRequireBluetoothOutput => {
  console.log(`🧠 useRequireBluetooth: ${type} ${isHookEnabled}`);

  // const [bluetoothRequirementsState, setBluetoothRequirementsState] =
  //   useState<BluetoothRequirementsState>("unknown");

  // isAndroidLocationPermissionHookEnabled =
  //   isHookEnabled && type === "scanning" && Platform.OS === "android";

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

  const isEnableBluetoothHookEnabled =
    isHookEnabled &&
    (Platform.OS === "ios" || androidHasBluetoothPermissions === "granted");

  // TODO: handle case of iOS and bluetooth permission
  const {
    bluetoothServicesState,
    checkAndRequestAgain: enableBluetoothCheckAndRequestAgain,
  } = useEnableBluetooth({
    isHookEnabled: isEnableBluetoothHookEnabled,
  });

  const isAndroidEnableLocationHookEnabled =
    isHookEnabled &&
    type === "scanning" &&
    Platform.OS === "android" &&
    bluetoothServicesState === "enabled";

  const {
    locationServicesState,
    checkAndRequestAgain: androidEnableLocationCheckAndRequestAgain,
  } = useAndroidEnableLocation({
    isHookEnabled: isAndroidEnableLocationHookEnabled,
  });

  let bluetoothRequirementsState = "unknown";
  let handleRetryOnIssue = null;

  // TODO: should also include check if associated hook enabled ?
  if (
    isAndroidBluetoothPermissionsHookEnabled &&
    androidHasBluetoothPermissions === "denied"
  ) {
    bluetoothRequirementsState = "bluetooth permissions ungranted";
    handleRetryOnIssue = androidBluetoothPermissionsRequestForPermissionsAgain;
  } else if (bluetoothServicesState === "disabled") {
    bluetoothRequirementsState = "bluetooth disabled";
    handleRetryOnIssue = enableBluetoothCheckAndRequestAgain;
  } else if (locationServicesState === "disabled") {
    bluetoothRequirementsState = "location disabled";
    handleRetryOnIssue = androidEnableLocationCheckAndRequestAgain;
  }

  return {
    bluetoothRequirementsState:
      bluetoothRequirementsState as BluetoothRequirementsState,
    handleRetryOnIssue,
  };
};
