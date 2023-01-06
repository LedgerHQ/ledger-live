import {
  Permission,
  PermissionsAndroid,
  Platform,
  AppState,
} from "react-native";
import { useCallback, useState, useEffect } from "react";

const { PERMISSIONS, RESULTS } = PermissionsAndroid;
export const bluetoothPermissions: Permission[] =
  Platform.OS === "android"
    ? Platform.Version < 31
      ? []
      : [PERMISSIONS.BLUETOOTH_SCAN, PERMISSIONS.BLUETOOTH_CONNECT]
    : [];

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

const useAndroidBLEPermissions = () => {
  const [hasPermission, setHasPermission] = useState<boolean | undefined>();
  const [check, setCheck] = useState(false);
  const [neverAskAgain, setNeverAskAgain] = useState(false);
  const [retryNonce, setRetryNonce] = useState(0);

  const checkAgain = useCallback(() => {
    setRetryNonce(new Date().getTime());
  }, []);

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
  }, [retryNonce]);

  /**
   * Requesting the permissions is only done on mount, once, note that it
   * triggers a background/active cycle on the app state which can lead to
   * loops if we set the listeners on app state change.
   */
  useEffect(() => {
    let cancelled = false;

    async function asyncRequestBluetoothPermissions() {
      const res = await requestBluetoothPermissions();
      if (!cancelled) {
        /** https://developer.android.com/about/versions/11/privacy/permissions#dialog-visibility */
        setNeverAskAgain(res.generalStatus === RESULTS.NEVER_ASK_AGAIN);
        setHasPermission(res.allGranted);
      }
    }

    asyncRequestBluetoothPermissions();

    return () => {
      cancelled = true;
    };
  }, []);

  const renderChildren =
    bluetoothPermissions.length === 0 || hasPermission || check;

  return {
    renderChildren,
    hasPermission,
    neverAskAgain,
    checkAgain,
  };
};

export default useAndroidBLEPermissions;
