import React from "react";
import { Platform } from "react-native";
import AndroidRequiresBluetoothPermissions from "./AndroidRequiresBluetoothPermissions";
import AndroidRequiresLocationPermissions from "../RequiresLocation/AndroidRequiresLocationPermissions";
import RequiresBluetoothEnabled from "./RequiresBluetoothEnabled";
import AndroidRequiresLocationEnabled from "../RequiresLocation/AndroidRequiresLocationEnabled";

type Props = {
  children?: React.ReactNode;
  hasBackButtonOnError?: boolean;
  openSettingsOnErrorButton?: boolean;
};

/**
 * Renders children if bluetooth is enabled and its associated needed permissions are set.
 * Otherwise, renders a relevant error component.
 *
 * @param children The children to render if bluetooth is correctly enabled
 * @param hasBackButtonOnError If true, the back button will be displayed on the different error component
 * @param openSettingsOnErrorButton Used for debug purposes. If true, on a permission denied or service disabled,
 *   pressing the button on the error component will make the user go to the settings.
 *   Otherwise it will try to prompt the user (to allow permission, or enable the service) if possible.
 *   Defaults to false.
 */
const RequiresBLE: React.FC<Props> = ({
  children,
  hasBackButtonOnError = false,
  openSettingsOnErrorButton = false,
}) => {
  if (Platform.OS === "android") {
    return (
      <AndroidRequiresBluetoothPermissions
        hasBackButtonOnDenied={hasBackButtonOnError}
        openSettingsOnErrorButton={openSettingsOnErrorButton}
      >
        <AndroidRequiresLocationPermissions
          hasBackButtonOnDenied={hasBackButtonOnError}
          openSettingsOnErrorButton={openSettingsOnErrorButton}
        >
          <AndroidRequiresLocationEnabled
            hasBackButtonOnError={hasBackButtonOnError}
            openSettingsOnErrorButton={openSettingsOnErrorButton}
          >
            <RequiresBluetoothEnabled
              hasBackButtonOnError={hasBackButtonOnError}
              openSettingsOnErrorButton={openSettingsOnErrorButton}
            >
              {children}
            </RequiresBluetoothEnabled>
          </AndroidRequiresLocationEnabled>
        </AndroidRequiresLocationPermissions>
      </AndroidRequiresBluetoothPermissions>
    );
  }

  // On iOS, only Bluetooth service is needed. Its permission is directly handled by `RequiresBluetoothEnabled`.
  return (
    <RequiresBluetoothEnabled
      hasBackButtonOnError={hasBackButtonOnError}
      openSettingsOnErrorButton={openSettingsOnErrorButton}
    >
      {children}
    </RequiresBluetoothEnabled>
  );
};

export default React.memo(RequiresBLE);
