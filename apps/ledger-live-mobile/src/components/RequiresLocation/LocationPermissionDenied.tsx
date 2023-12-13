import React, { useCallback, useContext } from "react";
import { PermissionsAndroid, Linking } from "react-native";
import { useTranslation } from "react-i18next";
import { locationPermission } from "./hooks/useAndroidLocationPermission";
import NoLocationImage from "~/icons/NoLocationImage";
import GenericInformationalDrawerContent from "../GenericInformationalDrawerContent";
import GenericInformationalView from "../GenericInformationalView";
import IsInDrawerContext from "~/context/IsInDrawerContext";

type Props = {
  onRetry?: (() => void) | null;
  neverAskAgain?: boolean;
  forceOpenSettings?: boolean;
};

/**
 * Renders a component that informs the user that they have denied the app permission for the location.
 *
 * If the user has selected/triggered "Don't ask again", the user will be prompted to open the native settings
 *
 * @param onRetry A callback for the user to retry allowing the permission, if neverAskAgain and forceOpenSettings are false.
 *   Otherwise, the user will be prompted to open the native settings.
 * @param neverAskAgain If true, the user has denied the app permission to use its location and has selected "Don't ask again". Default to true.
 * @param forceOpenSettings Used mainly for debug purposes. If true pressing the button will make the user go to the settings. Defaults to false.
 */
const LocationPermissionDenied: React.FC<Props> = ({
  onRetry,
  neverAskAgain = true,
  forceOpenSettings = false,
}) => {
  const { t } = useTranslation();
  const { isInDrawer } = useContext(IsInDrawerContext);

  const openNativeSettings = useCallback(() => {
    Linking.openSettings();
  }, []);

  const isFineLocationRequired =
    locationPermission === PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION;

  const title = isFineLocationRequired
    ? t("permissions.location.titlePermissionRequiredPrecise")
    : t("permissions.location.titlePermissionRequired");
  const description = isFineLocationRequired
    ? t("permissions.location.descriptionPermissionRequiredPrecise")
    : t("permissions.location.descriptionPermissionRequired");

  let buttonLabel;
  let onButtonPress;
  let buttonEvent;

  if (neverAskAgain || !onRetry || forceOpenSettings) {
    onButtonPress = openNativeSettings;
    buttonLabel = t("permissions.open");
    buttonEvent = "LocationPermissionDeniedOpenSettings";
  } else {
    onButtonPress = onRetry;
    buttonLabel = t("permissions.authorize");
    buttonEvent = "LocationPermissionDeniedRetryAuthorize";
  }

  if (isInDrawer) {
    return (
      <GenericInformationalDrawerContent
        icon={<NoLocationImage viewBox="0 0 113 114" height="60" width="60" />}
        title={title}
        description={description}
        primaryButtonLabel={buttonLabel}
        onPrimaryButtonPress={onButtonPress}
        primaryButtonEvent={buttonEvent}
      />
    );
  }

  return (
    <GenericInformationalView
      title={title}
      icon={<NoLocationImage viewBox="0 0 113 114" height="60" width="60" />}
      description={description}
      subTitle={t("location.noInfos")}
      primaryButtonLabel={buttonLabel}
      onPrimaryButtonPress={onButtonPress}
      primaryButtonEvent={buttonEvent}
    />
  );
};

export default LocationPermissionDenied;
