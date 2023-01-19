import React, { ReactNode } from "react";
import { useAndroidLocationPermission } from "./hooks/useAndroidLocationPermission";
import LocationPermissionDenied from "./LocationPermissionDenied";

type Props = {
  children?: ReactNode | undefined;
  hasBackButtonOnDenied?: boolean;
  openSettingsOnErrorButton?: boolean;
};

/**
 * Android: Renders an error if location is required & its associated permissions are not
 * set. Otherwise renders children.
 *
 * Should only be used for Android.
 *
 * @param hasBackButtonOnDenied If true, the back button will be displayed on the permission denied screen. Defaults to false.
 * @param openSettingsOnErrorButton Used for debug purposes. If true, on a permission denied, pressing the button on
 *   the error component will make the user go to the settings. Otherwise it will try to prompt the user to allow permission
 *   if possible. Defaults to false.
 */
const AndroidRequiresLocationPermissions: React.FC<Props> = ({
  children,
  hasBackButtonOnDenied = false,
  openSettingsOnErrorButton = false,
}) => {
  const { renderChildren, hasPermission, neverAskAgain, requestAgain } =
    useAndroidLocationPermission();

  if (hasPermission === undefined) return null; // Prevents blink

  return renderChildren ? (
    <>{children}</>
  ) : (
    <LocationPermissionDenied
      neverAskAgain={neverAskAgain}
      onRetry={requestAgain}
      hasBackButton={hasBackButtonOnDenied}
      openSettings={openSettingsOnErrorButton}
    />
  );
};

export default AndroidRequiresLocationPermissions;
