import React from "react";
import { useTranslation } from "react-i18next";
import useCameraPermissions from "./useCameraPermissions";
import Fallback from "./Fallback";
import CameraPermissionContext from "./CameraPermissionContext";

type Props = {
  /**
   * content to be rendered by this component if the permission is granted
   * */
  children?: React.ReactNode | null;
  /**
   * If this is true, the children will be rendered until the first permission
   * request resolves. This allows for a better UX as the native permission
   * prompt will thus be displayed over the children component, giving better
   * context, rather than directly showing an error screen.
   * */
  optimisticallyMountChildren?: boolean;
};

/**
 * This component performs an initial Camera permission check+request on mount
 * and depending on the result it renders its children or a fallback screen:
 *
 * If the permission is granted OR if the first permission request has not
 * resolved yet and the `optimisticallyMountChildren` prop is true
 *  -> it renders its children.
 *  NB: The "permissionGranted" boolean can be obtained with
 *  CameraPermissionContext (useful for `optimisticallyMountChildren`)
 *
 * Else
 *  -> if the permission *can* be requested again, it renders a fallback screen
 *     prompting the user to request the permission
 *  -> if the permission *cannot* be requested again, it renders a fallback
 *     screen prompting the user to navigate to app settings
 *
 * */
const RequiresCameraPermissions: React.FC<Props> = ({
  children,
  optimisticallyMountChildren = false,
}) => {
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
    (optimisticallyMountChildren && !firstAutomaticRequestCompleted)
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
