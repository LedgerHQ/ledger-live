import {
  Permission,
  PermissionsAndroid,
  Platform,
  AppState,
} from "react-native";
import { useRef, useCallback, useState, useEffect } from "react";

const { PERMISSIONS, RESULTS } = PermissionsAndroid;

// https://developer.android.com/guide/topics/connectivity/bluetooth/permissions#declare
export const locationPermission: Permission | undefined =
  Platform.OS === "android"
    ? Platform.Version <= 28
      ? PERMISSIONS.ACCESS_COARSE_LOCATION
      : PERMISSIONS.ACCESS_FINE_LOCATION
    : undefined;

async function checkLocationPermission() {
  if (!locationPermission) return true;
  return PermissionsAndroid.check(locationPermission);
}

type RequestResult = {
  granted: boolean;
  status: typeof RESULTS[number];
};

async function requestLocationPermission(): Promise<RequestResult> {
  if (!locationPermission) return { granted: true, status: RESULTS.GRANTED };
  return PermissionsAndroid.request(locationPermission).then(status => {
    return {
      granted: status === RESULTS.GRANTED,
      status,
    };
  });
}

const useAndroidLocationPermission = () => {
  const [hasPermission, setHasPermission] = useState<boolean | undefined>();
  const [check, setCheck] = useState(false);
  const [neverAskAgain, setNeverAskAgain] = useState(false);
  const [retryNonce, setRetryNonce] = useState(0);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const checkAgain = useCallback(() => {
    setRetryNonce(new Date().getTime());
  }, []);

  useEffect(() => {
    // set hasPermission to false after 400ms if it's still undefined.
    // without this we risk a black screen when this unmounts or a blink
    // if we ignore it. Feel free to come up with a better way.
    timeout.current = setTimeout(() => {
      setHasPermission(false);
    }, 200);
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
   * Check the permission at launch, allowing for a retry whenever we
   * come back from the background, also expose the retry mechanism for
   * manual triggers.
   */
  useEffect(() => {
    let cancelled = false;

    async function asyncCheckLocationPermissions() {
      const res = await checkLocationPermission();
      if (!cancelled) {
        setCheck(res);
      }
    }

    asyncCheckLocationPermissions();

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

    async function asyncRequestLocationPermission() {
      const res = await requestLocationPermission();
      if (!cancelled) {
        /** https://developer.android.com/about/versions/11/privacy/permissions#dialog-visibility */
        setHasPermission(res.granted);
        setNeverAskAgain(res.status === RESULTS.NEVER_ASK_AGAIN);
      }
    }

    asyncRequestLocationPermission();

    return () => {
      cancelled = true;
    };
  }, []);

  const renderChildren = !locationPermission || hasPermission || check;
  return {
    renderChildren,
    hasPermission,
    checkAgain,
    neverAskAgain,
  };
};

export default useAndroidLocationPermission;
