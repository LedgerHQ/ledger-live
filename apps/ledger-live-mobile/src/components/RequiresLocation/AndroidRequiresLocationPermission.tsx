import React, { ReactNode } from "react";
import { useAndroidLocationPermission } from "./hooks/useAndroidLocationPermission";
import LocationPermissionDenied from "./LocationPermissionDenied";

type Props = {
  children?: ReactNode | undefined;
  forceOpenSettingsOnErrorButton?: boolean;
};

/**
 * Renders children if the permission for the location services is granted.
 * Otherwise, tries to request the permission. And if the user denies, renders an error.
 *
 * Should only be used for Android.
 *
 * @param children The children to render if bluetooth has its associated permissions granted
 * @param forceOpenSettingsOnErrorButton Used mainly for debug purposes. If true, on a permission denied, pressing the button on
 *   the error component will make the user go to the settings. Otherwise it will try to prompt the user to allow permission
 *   if possible. Defaults to false.
 */
const AndroidRequiresLocationPermission: React.FC<Props> = ({
  children,
  forceOpenSettingsOnErrorButton = false,
}) => {
  const { hasPermission, neverAskAgain, requestForPermissionAgain } =
    useAndroidLocationPermission();

  if (hasPermission === "unknown") return null; // Prevents blink

  return hasPermission === "granted" ? (
    <>{children}</>
  ) : (
    <LocationPermissionDenied
      neverAskAgain={neverAskAgain}
      onRetry={requestForPermissionAgain}
      forceOpenSettings={forceOpenSettingsOnErrorButton}
    />
  );
};

export default AndroidRequiresLocationPermission;
