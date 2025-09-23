import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Linking } from "react-native";

// Camera functionality disabled - fallback implementation
const useCameraPermission = () => ({
  hasPermission: false,
  requestPermission: () => Promise.resolve(false),
});

export default function useCameraPermissions() {
  const { hasPermission, requestPermission: requestVisionCameraPermission } = useCameraPermission();
  const [firstAutomaticRequestCompleted, setFirstAutomaticRequestCompleted] =
    useState<boolean>(false);
  const shouldCheckPermissionOnNextResume = useRef(false);

  // Wrapper to maintain compatibility with existing code
  const requestPermission = useCallback(async () => {
    const granted = await requestVisionCameraPermission();
    return granted ? "granted" : "denied";
  }, [requestVisionCameraPermission]);

  const checkPermission = useCallback(async () => {
    return hasPermission ? "granted" : "denied";
  }, [hasPermission]);

  useEffect(() => {
    // Auto-request permission on mount if not granted
    const initializePermissions = async () => {
      if (!hasPermission) {
        await requestPermission();
      }
      setFirstAutomaticRequestCompleted(true);
    };

    initializePermissions();
  }, [hasPermission, requestPermission]);

  const openAppSettings = useCallback(() => {
    shouldCheckPermissionOnNextResume.current = true;
    Linking.openSettings();
  }, []);

  // Create compatible permission object for existing code
  const permission = useMemo(
    () => ({
      granted: hasPermission,
      canAskAgain: !hasPermission, // In vision-camera, we can always try to ask again
      status: hasPermission ? "granted" : "denied",
    }),
    [hasPermission],
  );

  const contextValue = useMemo(
    () => ({
      permissionGranted: hasPermission,
    }),
    [hasPermission],
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
