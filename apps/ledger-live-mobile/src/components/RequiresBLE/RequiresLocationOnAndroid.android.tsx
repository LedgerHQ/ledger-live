import React, { ReactNode, useCallback, useEffect, useState } from "react";
import { Permission, PermissionsAndroid, Platform } from "react-native";
import LocationRequired from "../../screens/LocationRequired";

/**
 * https://developer.android.com/guide/topics/connectivity/bluetooth/permissions#declare
 */
const locationPermission: Permission | undefined =
  Platform.OS === "android"
    ? Platform.Version <= 28
      ? PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION
      : PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
    : undefined;

/**
 * Renders an error if location is required & not available,
 * otherwise renders children
 */
const RequiresLocationOnAndroid: React.FC<{
  children?: ReactNode | undefined;
}> = ({ children }) => {
  const [granted, setGranted] = useState<boolean | null | undefined>(null);

  const request = useCallback(async () => {
    if (!locationPermission) return;
    const result = await PermissionsAndroid.request(locationPermission);
    setGranted(result === PermissionsAndroid.RESULTS.GRANTED);
  }, [setGranted]);

  const recheck = useCallback(async () => {
    if (!locationPermission) return;
    const granted = await PermissionsAndroid.check(locationPermission);
    setGranted(granted);
  }, [setGranted]);

  useEffect(() => {
    if (!locationPermission) return;
    request();
  }, [request]);

  if (!locationPermission) return <>{children}</>;
  if (granted === null) return null; // suspense PLZ
  if (granted === true) return <>{children}</>;
  return <LocationRequired errorType="unauthorized" onRetry={recheck} />;
};

export default RequiresLocationOnAndroid;
