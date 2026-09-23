import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCameraPermission, Camera } from "react-native-vision-camera";
import useIsMounted from "@ledgerhq/live-common/hooks/useIsMounted";
import { AppState, Linking } from "react-native";

export default function useCameraPermissions() {
  const { hasPermission, requestPermission: requestVisionPermission } = useCameraPermission();
  // Android opens the system permission screen even for a granted permission, which some devices
  // show over the whole app.
  const [firstAutomaticRequestCompleted, setFirstAutomaticRequestCompleted] = useState(
    () => Camera.getCameraPermissionStatus() === "granted",
  );
  const [permissionStatus, setPermissionStatus] = useState<{
    granted: boolean;
    canAskAgain: boolean;
  } | null>(null);
  const isMounted = useIsMounted();

  const checkPermission = useCallback(async () => {
    const status = Camera.getCameraPermissionStatus();
    if (isMounted()) {
      setPermissionStatus({
        granted: status === "granted",
        canAskAgain: status === "not-determined",
      });
    }
    return status;
  }, [isMounted]);

  const requestPermission = useCallback(async () => {
    const granted = await requestVisionPermission();
    if (isMounted()) {
      setPermissionStatus({
        granted,
        canAskAgain: false,
      });
    }
    return granted;
  }, [requestVisionPermission, isMounted]);

  useEffect(() => {
    if (!firstAutomaticRequestCompleted) {
      requestPermission().then(() => setFirstAutomaticRequestCompleted(true));
    }
    // only run this once on mount
  }, []); // oxlint-disable-line react-hooks/exhaustive-deps

  const appState = useRef(AppState.currentState);
  const shouldCheckPermissionOnNextResume = useRef(false);
  useEffect(() => {
    const subscription = AppState.addEventListener("change", nextAppState => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active" &&
        shouldCheckPermissionOnNextResume.current &&
        isMounted()
      ) {
        checkPermission();
        shouldCheckPermissionOnNextResume.current = false;
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [checkPermission, isMounted]);

  const openAppSettings = useCallback(() => {
    shouldCheckPermissionOnNextResume.current = true;
    Linking.openSettings();
  }, []);

  const permission = useMemo(
    () => permissionStatus ?? { granted: hasPermission, canAskAgain: !hasPermission },
    [hasPermission, permissionStatus],
  );

  const contextValue = useMemo(
    () => ({
      permissionGranted: permission?.granted ?? null,
    }),
    [permission?.granted],
  );

  return {
    permission,
    requestPermission,
    checkPermission,
    firstAutomaticRequestCompleted,
    openAppSettings,
    contextValue,
  };
}
