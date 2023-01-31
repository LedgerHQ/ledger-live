import React, { useCallback } from "react";
import { PermissionsAndroid, Linking } from "react-native";
import { useTranslation } from "react-i18next";
import { Icons } from "@ledgerhq/native-ui";

import ServicePermissionDeniedView from "../ServicePermissionDeniedView";
import { locationPermission } from "./hooks/useAndroidLocationPermission";
import NoLocationImage from "../../icons/NoLocationImage";
import InformationalMessageDrawerContent from "../InformationalMessageDrawerContent";

type Props = {
  onRetry?: (() => void) | null;
  neverAskAgain?: boolean;
  hasBackButton?: boolean;
  openSettings?: boolean;
  componentType?: "drawer" | "view";
};

/**
 * Renders a component that informs the user that they have denied the app permission for the location.
 *
 * If the user has selected/triggered "Don't ask again", the user will be prompted to open the native settings
 *
 * @param onRetry A callback for the user to retry allowing the permission, if neverAskAgain and openSettings are false.
 *   Otherwise, the user will be prompted to open the native settings.
 * @param hasBackButton If true, a back button will be displayed in the header. Default to false.
 * @param neverAskAgain If true, the user has denied the app permission to use its location and has selected "Don't ask again". Default to true.
 * @param openSettings Used for debug purposes. If true pressing the button will make the user go to the settings. Defaults to false.
 * @param componentType If "drawer", the component will be rendered as a content to be rendered in a drawer.
 *   If "view", the component will be rendered as a view. Defaults to "view".
 */
const LocationPermissionDenied: React.FC<Props> = ({
  onRetry,
  neverAskAgain = true,
  hasBackButton = false,
  openSettings = false,
  componentType = "view",
}) => {
  const { t } = useTranslation();

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
  let ButtonIcon;
  let onButtonPress;
  let buttonEvent;

  if (neverAskAgain || !onRetry || openSettings) {
    onButtonPress = openNativeSettings;
    ButtonIcon = Icons.SettingsMedium;
    buttonLabel = t("permissions.open");
    buttonEvent = "LocationPermissionDeniedOpenSettings";
  } else {
    onButtonPress = onRetry;
    buttonLabel = t("permissions.authorize");
    buttonEvent = "LocationPermissionDeniedRetryAuthorize";
  }

  if (componentType === "drawer") {
    return (
      <InformationalMessageDrawerContent
        iconType="error"
        title={title}
        description={description}
        primaryButtonLabel={buttonLabel}
        onPrimaryButtonPress={onButtonPress}
        primaryButtonEvent={buttonEvent}
      />
    );
  }

  return (
    <ServicePermissionDeniedView
      title={title}
      TitleIcon={<NoLocationImage />}
      description={description}
      subTitle={t("location.noInfos")}
      hasBackButton={hasBackButton}
      ButtonIcon={ButtonIcon}
      buttonLabel={buttonLabel}
      onButtonPress={onButtonPress}
      buttonEvent={buttonEvent}
    />
  );
};

export default LocationPermissionDenied;
