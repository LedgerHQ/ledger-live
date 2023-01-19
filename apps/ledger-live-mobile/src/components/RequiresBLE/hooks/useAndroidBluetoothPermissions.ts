import {
  Permission,
  PermissionsAndroid,
  Platform,
  AppState,
} from "react-native";
import { useRef, useCallback, useState, useEffect } from "react";

const { PERMISSIONS, RESULTS } = PermissionsAndroid;

// No check is done on iOS here
export const bluetoothPermissions: Permission[] =
  Platform.OS === "android"
    ? Platform.Version < 31
      ? []
      : [PERMISSIONS.BLUETOOTH_SCAN, PERMISSIONS.BLUETOOTH_CONNECT]
    : [];

/**
 * Checks if the app has the required permissions to use Bluetooth.
 *
 * On Android 11 and above, the app needs to have the BLUETOOTH_SCAN and BLUETOOTH_CONNECT permissions.
 * On iOS, no check is done and returns true.
 */
async function checkBluetoothPermissions() {
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
 * On Android 11 and above, the app needs to have the BLUETOOTH_SCAN and BLUETOOTH_CONNECT permissions.
 * On iOS, no request is done and returns true.
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

/**
 * Hook to check and request the BLE permission on Android.
 *
 * @returns an object with the following properties:
 * - hasPermission: true if the permission is granted, false if it's denied, undefined if it's still loading
 * - checkAgain: a function to check (and not request) again the permission
 * - neverAskAgain: true if the user has checked the "never ask again" checkbox (or on Android 11+ if the user has denied the permission several times)
 * - renderChildren: a boolean to know if the children should be rendered (permissions are granted) or not
 */
export const useAndroidBluetoothPermissions = () => {
  const [hasPermission, setHasPermission] = useState<boolean | undefined>();
  const [check, setCheck] = useState(false);
  const [neverAskAgain, setNeverAskAgain] = useState(false);
  const [retryCheckNonce, setRetryCheckNonce] = useState(0);
  const [retryRequestNonce, setRetryRequestNonce] = useState(0);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Exposes a retry mechanism only of the permission check
  const checkAgain = useCallback(() => {
    setRetryCheckNonce(new Date().getTime());
  }, []);

  // Exposes a retry mechanism only of the permission request
  const requestAgain = useCallback(() => {
    setRetryRequestNonce(i => i + 1);
    // setRetryRequestNonce(new Date().getTime());
  }, []);

  useEffect(() => {
    // set hasPermission to false after 400ms if it's still undefined.
    // without this we risk a black screen when this unmounts or a blink
    // if we ignore it. Feel free to come up with a better way.
    timeout.current = setTimeout(() => {
      setHasPermission(false);
    }, 400);

    return () => {
      if (timeout.current) clearTimeout(timeout.current);
    };
  }, []);

  /**
   * Goes to state="background" when for ex:
   * - the user enters settings
   * - the smartphone prompts the user to allow for the permission
   */
  useEffect(() => {
    const listener = AppState.addEventListener("change", state => {
      if (state === "active") {
        checkAgain();
      }
    });

    return () => {
      listener.remove();
    };
  }, [checkAgain]);

  /**
   * Check the permissions at launch, allowing for a retry whenever we
   * come back from the background, also expose the retry mechanism for
   * manual triggers.
   */
  useEffect(() => {
    let cancelled = false;

    async function asyncCheckBluetoothPermissions() {
      const res = await checkBluetoothPermissions();
      if (!cancelled) {
        setCheck(res);
      }
    }

    asyncCheckBluetoothPermissions();

    return () => {
      cancelled = true;
    };
  }, [retryCheckNonce]);

  /**
   * Requesting the permissions is only done on mount, once TODO
   *
   * Note that it triggers a background/active cycle on the app state which can lead to
   * loops if we set the listeners on app state change.
   */
  useEffect(() => {
    let cancelled = false;

    async function asyncRequestBluetoothPermissions() {
      const res = await requestBluetoothPermissions();

      if (!cancelled) {
        if (timeout.current) {
          clearTimeout(timeout.current);
        }
        /** https://developer.android.com/about/versions/11/privacy/permissions#dialog-visibility */
        setNeverAskAgain(res.generalStatus === RESULTS.NEVER_ASK_AGAIN);
        setHasPermission(res.allGranted);
      }
    }

    asyncRequestBluetoothPermissions();

    return () => {
      cancelled = true;
    };
  }, [retryRequestNonce]);

  const renderChildren =
    bluetoothPermissions.length === 0 || hasPermission || check;

  return {
    renderChildren,
    hasPermission,
    neverAskAgain,
    checkAgain,
    requestAgain,
  };
};
