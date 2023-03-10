import React from "react";
import { useEnableBluetooth } from "./hooks/useEnableBluetooth";
import BluetoothDisabled from "./BluetoothDisabled";
import BluetoothPermissionsDenied from "./BluetoothPermissionsDenied";

type Props = {
  children?: React.ReactNode;
  forceOpenSettingsOnErrorButton?: boolean;
};

/**
 * Renders an error if bluetooth is required but is not enabled.
 * Otherwise renders children.
 *
 * Can be used for both Android and iOS.
 *
 * @param hasBackButtonOnError If true, the back button will be displayed on the permission denied or disabled error screens.
 * Defaults to false.
 * @param forceOpenSettingsOnErrorButton Used mainly for debug purposes. If true, on a bluetooth services disabled, pressing the button on
 *   the error component will make the user go to the settings. Otherwise it will try to prompt the user to enable their bluetooth
 *   services if possible. Defaults to false.
 */
const RequiresBluetoothEnabled: React.FC<Props> = ({
  children,
  forceOpenSettingsOnErrorButton = false,
}) => {
  const { bluetoothServicesState, checkAndRequestAgain } = useEnableBluetooth();

  switch (bluetoothServicesState) {
    case "unknown":
      // As long as we don't know the state of bluetooth, we don't render anything
      return null;
    case "enabled":
      return <>{children}</>;
    case "unauthorized":
      return <BluetoothPermissionsDenied />;
    default:
    case "disabled":
      return (
        <BluetoothDisabled
          onRetry={checkAndRequestAgain}
          forceOpenSettings={forceOpenSettingsOnErrorButton}
        />
      );
  }
};

export default RequiresBluetoothEnabled;
