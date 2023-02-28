import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Camera } from "expo-camera";
import useIsMounted from "@ledgerhq/live-common/hooks/useIsMounted";
import { AppState, Linking } from "react-native";

export default function useCameraPermissions() {
  const [permission, requestPermission, checkPermission] =
    Camera.useCameraPermissions();
  const [firstAutomaticRequestCompleted, setFirstAutomaticRequestCompleted] =
    useState<boolean>(false);
  const isMounted = useIsMounted();

  useEffect(() => {
    requestPermission().then(() => setFirstAutomaticRequestCompleted(true));
    // only run this once on mount
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
