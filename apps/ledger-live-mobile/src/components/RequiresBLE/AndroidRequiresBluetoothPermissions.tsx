import React, { ReactNode } from "react";
import BluetoothPermissionsDenied from "./BluetoothPermissionsDenied";
import { useAndroidBluetoothPermissions } from "./hooks/useAndroidBluetoothPermissions";

type Props = {
  children?: ReactNode | undefined;
  hasBackButtonOnDenied?: boolean;
  openSettingsOnErrorButton?: boolean;
};

/**
 * Renders children if the permissions for the bluetooth are granted.
 * Otherwise, tries to request the permissions. And if the user denies, renders an error.
 *
 * Should only be used for Android.
 *
 * @param children The children to render if bluetooth has its associated permissions granted
 * @param hasBackButtonOnDenied If true, the back button will be displayed on the permission denied screen. Defaults to false.
 * @param openSettingsOnErrorButton Used for debug purposes. If true, on a permission denied, pressing the button on
 *   the error component will make the user go to the settings. Otherwise it will try to prompt the user to allow permission
 *   if possible. Defaults to false.
 */
const AndroidRequiresBluetoothPermissions: React.FC<Props> = ({
  children,
  hasBackButtonOnDenied = false,
  openSettingsOnErrorButton = false,
}) => {
  const { hasPermissions, neverAskAgain, requestForPermissionsAgain } =
    useAndroidBluetoothPermissions();

  if (hasPermissions === "unknown") return null; // Prevents blink

  return hasPermissions === "granted" ? (
    <>{children}</>
  ) : (
    <BluetoothPermissionsDenied
      onRetry={requestForPermissionsAgain}
      neverAskAgain={neverAskAgain}
      hasBackButton={hasBackButtonOnDenied}
      openSettings={openSettingsOnErrorButton}
    />
  );
};

export default React.memo(AndroidRequiresBluetoothPermissions);
