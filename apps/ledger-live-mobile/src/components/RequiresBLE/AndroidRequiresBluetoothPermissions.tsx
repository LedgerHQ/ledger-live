import React, { ReactNode } from "react";
import BluetoothPermissionDenied from "./BluetoothPermissionDenied";
import { useAndroidBluetoothPermissions } from "./hooks/useAndroidBluetoothPermissions";

type Props = {
  children?: ReactNode | undefined;
  hasBackButtonOnDenied?: boolean;
  openSettingsOnErrorButton?: boolean;
};

/**
 * Renders an error if bluetooth is required & its associated permissions are not
 * set. Otherwise renders children.
 *
 * Should only be used for Android.
 *
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
  // checkAgain is not used because calling it does not prompt the user for permission again
  const { renderChildren, hasPermission, neverAskAgain, requestAgain } =
    useAndroidBluetoothPermissions();

  if (hasPermission === undefined) return null; // Prevents blink

  return renderChildren ? (
    <>{children}</>
  ) : (
    <BluetoothPermissionDenied
      onRetry={requestAgain}
      neverAskAgain={neverAskAgain}
      hasBackButton={hasBackButtonOnDenied}
      openSettings={openSettingsOnErrorButton}
    />
  );
};

export default React.memo(AndroidRequiresBluetoothPermissions);
