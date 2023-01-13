import React from "react";
import { useTranslation } from "react-i18next";
import useCameraPermissions from "./useCameraPermissions";
import Fallback from "./Fallback";
import CameraPermissionContext from "./CameraPermissionContext";

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
      <Fallback
        event="CameraPressAuthorize"
        onPress={requestPermission}
        title={t("permissions.camera.title")}
        description={t("permissions.camera.authorizeDescription")}
        buttonTitle={t("permissions.camera.authorizeButtonTitle")}
      />
    );
  return (
    <Fallback
      event="CameraOpenSettings"
      onPress={openAppSettings}
      title={t("permissions.camera.title")}
      description={t("permissions.camera.goToSettingsDescription")}
      buttonTitle={t("permissions.camera.goToSettingsButtonTitle")}
    />
  );
};

export default RequiresCameraPermissions;
