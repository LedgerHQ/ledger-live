import { Platform } from "react-native";

// import { useAndroidBluetoothPermissions } from "./useAndroidBluetoothPermissions";
import { useEnableBluetooth } from "./useEnableBluetooth";
// import { useAndroidLocationPermission } from "../../RequiresLocation/hooks/useAndroidLocationPermission";
import { useAndroidEnableLocation } from "../../RequiresLocation/hooks/useAndroidEnableLocation";

export type BluetoothRequirementsState =
  | "unknown"
  | "bluetooth disabled"
  | "location disabled"
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

  const isEnableBluetoothHookEnabled = isHookEnabled;
  const isAndroidEnableLocationHookEnabled =
    isHookEnabled && type === "scanning" && Platform.OS === "android";

  const {
    bluetoothServiceState,
    checkAndRequestAgain: enableBluetoothCheckAndRequestAgain,
  } = useEnableBluetooth({
    isHookEnabled: isEnableBluetoothHookEnabled,
  });

  const {
    locationServicesState,
    checkAndRequestAgain: androidEnableLocationCheckAndRequestAgain,
  } = useAndroidEnableLocation({
    isHookEnabled: isAndroidEnableLocationHookEnabled,
  });

  let bluetoothRequirementsState = "unknown";
  let handleRetryOnIssue = null;

  if (bluetoothServiceState === "disabled") {
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
