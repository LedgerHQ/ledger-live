import {
  Permission,
  PermissionsAndroid,
  Platform,
  AppState,
  NativeEventSubscription,
} from "react-native";
import { useCallback, useState, useEffect } from "react";

const { PERMISSIONS, RESULTS } = PermissionsAndroid;

/**
 * On Android 9 and before, the app needs to have the ACCESS_COARSE_LOCATION permission. After it needs the ACCESS_FINE_LOCATION permission.
 *
 * See https://developer.android.com/guide/topics/connectivity/bluetooth/permissions#declare
 *
 * On iOS, no check is done here.
 */
export const locationPermission: Permission | undefined =
  Platform.OS === "android"
    ? Platform.Version <= 28
      ? PERMISSIONS.ACCESS_COARSE_LOCATION
      : PERMISSIONS.ACCESS_FINE_LOCATION
    : undefined;

/**
 * Checks (without requesting) if the app has the required permissions to use Bluetooth.
 */
async function checkLocationPermission() {
  if (!locationPermission) return true;
  return PermissionsAndroid.check(locationPermission);
}

type RequestResult = {
  granted: boolean;
  status: typeof RESULTS[number];
};

/**
 * Requests the required permission to use location (for the bluetooth scanning)
 *
 * If the permission is already granted, the request acts as a check for the user.
 */
async function requestLocationPermission(): Promise<RequestResult> {
  if (!locationPermission) return { granted: true, status: RESULTS.GRANTED };
  return PermissionsAndroid.request(locationPermission).then(status => {
    return {
      granted: status === RESULTS.GRANTED,
      status,
    };
  });
}

export type PermissionState = "unknown" | "granted" | "denied";

export type UseAndroidLocationPermissionArgs = {
  isHookEnabled?: boolean;
};

/**
 * Hook to check and request the location permission on Android.
 *
 * On mount, it requests for the location permissions. If they are already granted, the request is only a check
 * and no prompt is displayed to the user.
 * If the location permission is not set, the user is prompted to allow the permission,
 * except if the user had the android option "never ask again" set on this permission.
 *
 * When the state of the app ("active", "background" etc.) changes and is back to "active", the location permission is checked again.
 * This time, it is only a check, not a request, and no prompt will be displayed to the user.
 *
 * @param isHookEnabled if false, the hook will not check/requests for the permissions and will not listen to the app state changes.
 *   Defaults to true.
 *
 * @returns an object with the following properties:
 * - hasPermission: "granted" if the location permission is granted, "denied" if it is denied, "unknown" if it is still being checked/requested
 * - requestForPermissionAgain: a function to request again (and if only granted, only a check without any prompt) the location permission
 * - neverAskAgain: true if the user has checked the "never ask again" checkbox (or on Android 11+ if the user has denied the permission several times)
 */
export const useAndroidLocationPermission = (
  { isHookEnabled = true }: UseAndroidLocationPermissionArgs = {
    isHookEnabled: true,
  },
) => {
  // If no permission is required, we consider that the permission is granted
  const [hasPermission, setHasPermission] = useState<PermissionState>(
    !locationPermission ? "granted" : "unknown",
  );
  const [neverAskAgain, setNeverAskAgain] = useState(false);

  const [checkPermissionNonce, setCheckPermissionNonce] = useState(0);
  const [requestPermissionNonce, setRequestPermissionNonce] = useState(0);

  // Exposes a retry mechanism to request again for permissions
  const requestForPermissionAgain = useCallback(() => {
    setRequestPermissionNonce(i => i + 1);
  }, []);

  /**
   * Listens to a change in the app state (active/background/inactive/unknown/extension)
   * and triggers a permission checking if the app comes back to the "active" state.
   *
   * The permissions might have changed when the app was in the state "background".
   * Indeed, the value of the state is set to "background" when for ex:
   * - the user enters settings
   * - the smartphone prompts the user to allow for the permission
   */
  useEffect(() => {
    let listener: NativeEventSubscription | null;

    if (isHookEnabled) {
      listener = AppState.addEventListener("change", state => {
        if (state === "active") {
          setCheckPermissionNonce(i => i + 1);
        }
      });
    }

    return () => {
      if (listener) {
        listener.remove();
      }
    };
  }, [isHookEnabled]);

  /**
   * Checks the location permission when the app state changes back to "active".
   * Does not check the permissions on mount.
   *
   * Handles the check in a useEffect to handle cancellations with the async checking function
   */
  useEffect(() => {
    let cancelled = false;

    async function asyncCheckLocationPermissions() {
      const res = await checkLocationPermission();
      if (!cancelled) {
        setHasPermission(res ? "granted" : "denied");
      }
    }

    if (isHookEnabled) {
      // Does not check the permissions on mount.
      // Only when the app state changes.
      if (checkPermissionNonce > 0) {
        asyncCheckLocationPermissions();
      }
    }

    return () => {
      cancelled = true;
    };
  }, [checkPermissionNonce, isHookEnabled]);

  /**
   * Triggers a request of the location permission: on mount, and every time requestPermissionNonce is updated
   *
   * Handles the request in a useEffect to handle cancellations with the async request function
   *
   * Note that it triggers a "background"/"active" cycle of the app state, which can lead to loops if we
   * incorrectly set the listeners on app state change.
   */
  useEffect(() => {
    let cancelled = false;

    async function asyncRequestLocationPermission() {
      const res = await requestLocationPermission();
      if (!cancelled) {
        /** https://developer.android.com/about/versions/11/privacy/permissions#dialog-visibility */
        setNeverAskAgain(res.status === RESULTS.NEVER_ASK_AGAIN);
        setHasPermission(res.granted ? "granted" : "denied");
      }
    }

    if (isHookEnabled) {
      asyncRequestLocationPermission();
    }

    return () => {
      cancelled = true;
    };
  }, [isHookEnabled, requestPermissionNonce]);

  return {
    hasPermission,
    neverAskAgain,
    requestForPermissionAgain,
  };
};
