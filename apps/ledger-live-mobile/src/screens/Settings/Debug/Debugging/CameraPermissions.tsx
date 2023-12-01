import React, { useState } from "react";
import { Button, Flex, Switch, Text } from "@ledgerhq/native-ui";
import { Camera } from "expo-camera";
import { useIsFocused } from "@react-navigation/native";
import { CameraType } from "expo-camera/build/Camera.types";
import RequiresCameraPermissions from "~/components/RequiresCameraPermissions";
import CameraPermissionContext from "~/components/RequiresCameraPermissions/CameraPermissionContext";

const CameraPermissions: React.FC<Record<string, never>> = () => {
  const [optimistic, setOptimistic] = useState(false);
  const [mounted, setMounted] = useState(false);
  const isFocused = useIsFocused();
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
                isFocused ? (
                  <Camera
                    type={CameraType.back}
                    style={{
                      height: 200,
                      width: 200,
                      alignSelf: "center",
                    }}
                  />
                ) : (
                  <Text>screen not in focus, camera not mounted</Text>
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
