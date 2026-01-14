import React from "react";
import { Platform } from "react-native";
import AndroidRequiresBluetoothPermissions from "./AndroidRequiresBluetoothPermissions";
import AndroidRequiresLocationPermission from "../RequiresLocation/AndroidRequiresLocationPermission";
import RequiresBluetoothEnabled from "./RequiresBluetoothEnabled";
import AndroidRequiresLocationEnabled from "../RequiresLocation/AndroidRequiresLocationEnabled";

type Props = {
  children?: React.ReactNode;
  forceOpenSettingsOnErrorButton?: boolean;
};

/**
 * Renders children if bluetooth is enabled and its associated needed permissions are set.
 * Otherwise, renders a relevant error component.
 *
 * @param children The children to render if bluetooth (and location on Android) has the correct granted permissions and is enabled
 * @param hasBackButtonOnError If true, the back button will be displayed on the different error component. Default to false.
 * @param forceOpenSettingsOnErrorButton Used mainly for debug purposes. If true, on a permission denied or service disabled,
 *   pressing the button on the error component will make the user go to the settings.
 *   Otherwise it will try to prompt the user (to allow permission, or enable the service) if possible.
 *   Defaults to false.
 */
const RequiresBLE: React.FC<Props> = ({ children, forceOpenSettingsOnErrorButton = false }) => {
  if (Platform.OS === "android") {
    /*
     * FIXME: temporary fix to avoid this issue: https://github.com/facebook/react-native/issues/53887
     * To revert to `forceOpenSettingsOnErrorButton` when React Native gets upgraded to 0.81.5
     * to include the fix https://github.com/facebook/react-native/commit/447a7a3527e3e38e4c3ceb330d12d77afe7bc0b4
     */
    const forceOpenSettingsForPermissions = true;
    return (
      <AndroidRequiresBluetoothPermissions
        forceOpenSettingsOnErrorButton={forceOpenSettingsForPermissions}
      >
        <RequiresBluetoothEnabled forceOpenSettingsOnErrorButton={forceOpenSettingsOnErrorButton}>
          <AndroidRequiresLocationPermission
            required={Platform.Version <= 30}
            forceOpenSettingsOnErrorButton={forceOpenSettingsForPermissions}
          >
            <AndroidRequiresLocationEnabled
              required={Platform.Version <= 30}
              forceOpenSettingsOnErrorButton={forceOpenSettingsOnErrorButton}
            >
              {children}
            </AndroidRequiresLocationEnabled>
          </AndroidRequiresLocationPermission>
        </RequiresBluetoothEnabled>
      </AndroidRequiresBluetoothPermissions>
    );
  }

  // On iOS, only Bluetooth service is needed. Its permission is directly handled by `RequiresBluetoothEnabled`.
  return (
    <RequiresBluetoothEnabled forceOpenSettingsOnErrorButton={forceOpenSettingsOnErrorButton}>
      {children}
    </RequiresBluetoothEnabled>
  );
};

export default React.memo(RequiresBLE);
