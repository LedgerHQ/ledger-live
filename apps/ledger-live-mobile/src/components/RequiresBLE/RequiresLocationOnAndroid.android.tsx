import React, { ReactNode, useCallback, useEffect, useState } from "react";
import { PermissionsAndroid, Platform } from "react-native";
import LocationRequired from "../../screens/LocationRequired";

const permission = PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION;

/**
 * Location permission is not required to perform a bluetooth scan on devices
 * with Android 12 and above (API 31)
 * https://developer.android.com/guide/topics/connectivity/bluetooth/permissions#assert-never-for-location
 * */
const requiresLocation = Platform.OS === "android" && Platform.Version < 31;

/**
 * Renders an error if location is required & not available,
 * otherwise renders children
 */
const RequiresLocationOnAndroid: React.FC<{
  children?: ReactNode | undefined;
}> = ({ children }) => {
  const [granted, setGranted] = useState<boolean | null | undefined>(null);

  const request = useCallback(async () => {
    const result = await PermissionsAndroid.request(permission);
    setGranted(result === PermissionsAndroid.RESULTS.GRANTED);
  }, [setGranted]);

  const recheck = useCallback(async () => {
    const granted = await PermissionsAndroid.check(permission);
    setGranted(granted);
  }, [setGranted]);

  useEffect(() => {
    if (!requiresLocation) return;
    request();
  }, [request]);

  if (!requiresLocation) return <>{children}</>;
  if (granted === null) return null; // suspense PLZ
  if (granted === true) return <>{children}</>;
  return <LocationRequired errorType="unauthorized" onRetry={recheck} />;
};

export default RequiresLocationOnAndroid;
