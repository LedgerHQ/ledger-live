import React, { useState } from "react";
import { Button, Flex, Switch, Text } from "@ledgerhq/native-ui";
import { useIsFocused } from "@react-navigation/native";
import RequiresCameraPermissions from "~/components/RequiresCameraPermissions";
import CameraPermissionContext from "~/components/RequiresCameraPermissions/CameraPermissionContext";

// Safe imports with fallback
let Camera: any, useCameraDevice: any;
try {
  const visionCamera = require("react-native-vision-camera");
  Camera = visionCamera.Camera;
  useCameraDevice = visionCamera.useCameraDevice;
} catch (error) {
  console.warn("react-native-vision-camera not available:", error);
  Camera = () => null;
  useCameraDevice = () => null;
}

const CameraPermissions: React.FC<Record<string, never>> = () => {
  const [optimistic, setOptimistic] = useState(false);
  const [mounted, setMounted] = useState(false);
  const isFocused = useIsFocused();
  const device = useCameraDevice ? useCameraDevice("back") : null;

  return (
    <Flex flex={1} p={6}>
      <Switch
        checked={optimistic}
        onChange={val => setOptimistic(val)}
        label={
          'Optimistic (wait the for first permission request to resolve before showing "permission missing" screen)'
        }
      />
      <Flex mt={10} />
      {mounted ? (
        <RequiresCameraPermissions optimisticallyMountChildren={optimistic}>
          <CameraPermissionContext.Consumer>
            {({ permissionGranted }) =>
              permissionGranted ? (
                isFocused && device && Camera ? (
                  <Camera
                    device={device}
                    isActive={true}
                    style={{
                      height: 200,
                      width: 200,
                      alignSelf: "center",
                    }}
                  />
                ) : (
                  <Text>
                    {!isFocused
                      ? "screen not in focus, camera not mounted"
                      : !Camera
                        ? "Camera module not available"
                        : "Camera not available"}
                  </Text>
                )
              ) : (
                <Text>waiting for permission (optimistic strategy)</Text>
              )
            }
          </CameraPermissionContext.Consumer>
        </RequiresCameraPermissions>
      ) : (
        <Button mt={3} type="main" onPress={() => setMounted(true)}>
          Mount a camera requiring component
        </Button>
      )}
    </Flex>
  );
};

export default CameraPermissions;
