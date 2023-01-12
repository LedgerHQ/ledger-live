import React from "react";
import { Button } from "@ledgerhq/native-ui";
import useCameraPermissions from "./useCameraPermissions";

type PermissionMissingProps = {
  onPress: () => void;
  title: string;
  description: string;
  buttonLabel: string;
};

type CameraPermissionContext = {
  permissionGranted: boolean | null;
};
export const CameraPermissionContext =
  React.createContext<CameraPermissionContext>({
    permissionGranted: null,
  });

const PermissionMissingShouldOpenSettings: React.FC<PermissionMissingProps> = ({
  onPress,
}) => (
  <Button type="main" onPress={onPress}>
    open settings
  </Button>
);

const PermissionMissingCanRequest: React.FC<PermissionMissingProps> = ({
  onPress,
}) => (
  <Button type="main" onPress={onPress}>
    Can request permission
  </Button>
);

const RequiresCameraPermissions: React.FC<{
  children?: React.ReactNode | null;
  optimisticlyMountChildren?: boolean;
}> = ({ children, optimisticlyMountChildren = false }) => {
  const {
    permission,
    requestPermission,
    // checkPermission,
    firstAutomaticRequestCompleted,
    openAppSettings,
    contextValue,
  } = useCameraPermissions();

  if (
    permission?.granted ||
    (optimisticlyMountChildren && !firstAutomaticRequestCompleted)
  )
    return (
      <CameraPermissionContext.Provider value={contextValue}>
        {children}
      </CameraPermissionContext.Provider>
    );
  if (permission?.canAskAgain)
    return (
      <PermissionMissingCanRequest
        onPress={requestPermission}
        title=""
        description=""
        buttonLabel=""
      />
    );
  return (
    <PermissionMissingShouldOpenSettings
      onPress={openAppSettings}
      title=""
      description=""
      buttonLabel=""
    />
  );
};

export default RequiresCameraPermissions;
