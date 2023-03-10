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
 * On Android 11 and above, the app needs to have the BLUETOOTH_SCAN and BLUETOOTH_CONNECT permissions.
 *
 * On iOS, no check is done here.
 */
export const bluetoothPermissions: Permission[] =
  Platform.OS === "android"
    ? Platform.Version < 31
      ? []
      : [PERMISSIONS.BLUETOOTH_SCAN, PERMISSIONS.BLUETOOTH_CONNECT]
    : [];

/**
 * Checks (without requesting) if the app has the required permissions to use Bluetooth.
 */
async function checkBluetoothPermissions(): Promise<boolean> {
  if (bluetoothPermissions.length === 0) return true;

  return Promise.all(
    bluetoothPermissions.map(permission =>
      PermissionsAndroid.check(permission),
    ),
  ).then(results => results.every(res => res));
}

type RequestMultipleResult = {
  allGranted: boolean;
  generalStatus: typeof PermissionsAndroid.RESULTS[number];
};

/**
 * Requests the required permissions to use Bluetooth.
 *
 * If the permissions are already granted, the request acts as a check for the user.
 */
async function requestBluetoothPermissions(): Promise<RequestMultipleResult> {
  if (bluetoothPermissions.length === 0)
    return { allGranted: true, generalStatus: RESULTS.GRANTED };

  return PermissionsAndroid.requestMultiple(bluetoothPermissions).then(res => {
    const permissionStatuses = Object.values(res);
    const allGranted = permissionStatuses.every(
      status => status === RESULTS.GRANTED,
    );

    /** https://developer.android.com/about/versions/11/privacy/permissions#dialog-visibility */
    const someNeverAskAgain = permissionStatuses.some(
      status => status === RESULTS.NEVER_ASK_AGAIN,
    );

    return {
      allGranted,
      generalStatus: allGranted
        ? RESULTS.GRANTED
        : someNeverAskAgain
        ? RESULTS.NEVER_ASK_AGAIN
        : RESULTS.DENIED,
    };
  });
}

export type PermissionsState = "unknown" | "granted" | "denied";

export type UseAndroidBluetoothPermissionsArgs = {
  isHookEnabled?: boolean;
};

/**
 * Hook to check and request the BLE permissions on Android.
 *
 * On mount, it requests for the BLE permissions. If they are already granted, the request is only a check
 * and no prompt is displayed to the user.
 * If the permissions are not set, the user is prompted to allow the permissions,
 * except if the user had the android option "never ask again" set on those permissions.
 *
 * When the state of the app ("active", "background" etc.) changes and is back to "active", the permissions are checked again.
 * This time, it is only a check, not a request, and no prompt will be displayed to the user.
 *
 * @param isHookEnabled if false, the hook will not check/requests for the permissions and will not listen to the app state changes.
 *   Defaults to true.
 *
 * @returns an object with the following properties:
 * - hasPermissions: "granted" if the permissions are granted, "denied" if they are denied, "unknown" if they are still being checked/requested
 * - requestForPermissionsAgain: a function to request again (and if only granted, only a check without any prompt) the BLE permissions
 * - neverAskAgain: true if the user has checked the "never ask again" checkbox (or on Android 11+ if the user has denied the permission several times)
 */
export const useAndroidBluetoothPermissions = (
  { isHookEnabled = true }: UseAndroidBluetoothPermissionsArgs = {
    isHookEnabled: true,
  },
) => {
  // If no permissions are required, we consider that the permissions are granted
  const [hasPermissions, setHasPermissions] = useState<PermissionsState>(
    bluetoothPermissions.length === 0 ? "granted" : "unknown",
  );
  const [neverAskAgain, setNeverAskAgain] = useState(false);
  const [checkPermissionsNonce, setCheckPermissionsNonce] = useState(0);
  const [requestPermissionsNonce, setRequestPermissionsNonce] = useState(0);

  // Exposes a retry mechanism to request again for permissions
  const requestForPermissionsAgain = useCallback(() => {
    setRequestPermissionsNonce(i => i + 1);
  }, []);

  /**
   * Listens to a change in the app state (active/background/inactive/unknown/extension)
   * and triggers a permissions checking if the app comes back to the "active" state.
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
          setCheckPermissionsNonce(i => i + 1);
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
   * Checks the bluetooth permissions when the app state changes back to "active".
   * Does not check the permissions on mount.
   *
   * Handles the check in a useEffect to handle cancellations with the async checking function
   */
  useEffect(() => {
    let cancelled = false;

    async function asyncCheckBluetoothPermissions() {
      const res = await checkBluetoothPermissions();
      if (!cancelled) {
        setHasPermissions(res ? "granted" : "denied");
      }
    }

    if (isHookEnabled) {
      // Does not check the permissions on mount.
      // Only when the app state changes.
      if (checkPermissionsNonce > 0) {
        asyncCheckBluetoothPermissions();
      }
    }

    return () => {
      cancelled = true;
    };
  }, [checkPermissionsNonce, isHookEnabled]);

  /**
   * Triggers a request of the bluetooth permissions: on mount, and every time requestPermissionsNonce is updated
   *
   * Handles the request in a useEffect to handle cancellations with the async request function
   *
   * Note that it triggers a "background"/"active" cycle of the app state, which can lead to loops if we
   * incorrectly set the listeners on app state change.
   */
  useEffect(() => {
    let cancelled = false;

    async function asyncRequestBluetoothPermissions() {
      const res = await requestBluetoothPermissions();

      if (!cancelled) {
        /** https://developer.android.com/about/versions/11/privacy/permissions#dialog-visibility */
        setNeverAskAgain(res.generalStatus === RESULTS.NEVER_ASK_AGAIN);
        setHasPermissions(res.allGranted ? "granted" : "denied");
      }
    }

    if (isHookEnabled) {
      asyncRequestBluetoothPermissions();
    }

    return () => {
      cancelled = true;
    };
  }, [isHookEnabled, requestPermissionsNonce]);

  return {
    hasPermissions,
    neverAskAgain,
    requestForPermissionsAgain,
  };
};
