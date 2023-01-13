import React from "react";
import { useTranslation } from "react-i18next";
import useCameraPermissions from "./useCameraPermissions";
import FallbackCameraBody from "./FallbackCameraBody";

type CameraPermissionContext = {
  permissionGranted: boolean | null;
};
export const CameraPermissionContext =
  React.createContext<CameraPermissionContext>({
    permissionGranted: null,
  });

const RequiresCameraPermissions: React.FC<{
  children?: React.ReactNode | null;
  optimisticlyMountChildren?: boolean;
}> = ({ children, optimisticlyMountChildren = false }) => {
  const { t } = useTranslation();
  const {
    permission,
    requestPermission,
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
      <FallbackCameraBody
        event="CameraPressAuthorize"
        onPress={requestPermission}
        title={t("permissions.camera.title")}
        description={t("permissions.camera.authorizeDescription")}
        buttonTitle={t("permissions.camera.authorizeButtonTitle")}
      />
    );
  return (
    <FallbackCameraBody
      event="CameraOpenSettings"
      onPress={openAppSettings}
      title={t("permissions.camera.title")}
      description={t("permissions.camera.goToSettingsDescription")}
      buttonTitle={t("permissions.camera.goToSettingsButtonTitle")}
    />
  );
};

export default RequiresCameraPermissions;
