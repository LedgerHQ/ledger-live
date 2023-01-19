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

export const useAndroidLocationPermission = () => {
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
    setRetryRequestNonce(new Date().getTime());
  }, []);

  useEffect(() => {
    // Sets hasPermission to false after 400ms if it's still undefined.
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
   * Checks the permission at launch, allowing for a retry whenever we
   * come back from the background.
   * Also exposes the retry mechanism (on the permission check, not request) for manual triggers.
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
  }, [retryCheckNonce]);

  /**
   * Requesting the permissions is only done on mount, once TODO
   *
   * Note that it triggers a state "background"/"active" cycle on the app state which can lead to
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
  }, [retryRequestNonce]);

  const renderChildren = !locationPermission || hasPermission || check;
  return {
    renderChildren,
    hasPermission,
    neverAskAgain,
    checkAgain,
    requestAgain,
  };
};
