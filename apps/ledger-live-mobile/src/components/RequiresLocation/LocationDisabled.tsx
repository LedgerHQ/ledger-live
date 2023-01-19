import React from "react";
import { useTranslation } from "react-i18next";
import { Icons } from "@ledgerhq/native-ui";
import LocationServicesDialogBox from "react-native-android-location-services-dialog-box";

import NoLocationImage from "../../icons/NoLocationImage";
import ServiceDisabledView from "../ServiceDisabledView";

type Props = {
  onRetry?: () => void;
  hasBackButton?: boolean;
  openSettings?: boolean;
};

/**
 * Renders a component that informs the user that they have disabled their location services.
 *
 * The default behavior to open the location native settings only works on Android.
 * This is fine because, currently, this type of error (location disabled) is only happening on Android.
 * Indeed, LLM does not need the location service on iOS.
 *
 * @param onRetry A callback for the user to retry enabling the service. If undefined or if openSettings is true,
 *   the user will be prompted to open the native settings.
 * @param hasBackButton If true, a back button will be displayed in the header. Default to false.
 * @param openSettings Used for debug purposes. If true pressing the button will make the user go to the settings. Defaults to false.
 */
const LocationDisabled: React.FC<Props> = ({
  onRetry,
  hasBackButton = false,
  openSettings = false,
}) => {
  const { t } = useTranslation();

  // Only handles android
  const openNativeLocationServicesSetting = () => {
    LocationServicesDialogBox.checkLocationServicesIsEnabled({
      enableHighAccuracy: false,
      showDialog: false,
      openLocationServices: true,
    })
      .then()
      .catch(() => {
        // Nothing to do: location is still disabled
      });
  };

  let onButtonPress;
  let ButtonIcon;
  let buttonLabel;
  let buttonEvent;

  if (!onRetry || openSettings) {
    onButtonPress = openNativeLocationServicesSetting;
    ButtonIcon = Icons.SettingsMedium;
    buttonLabel = t("location.openSettings");
    buttonEvent = "LocationServicesDisabledOpenSettings";
  } else {
    onButtonPress = onRetry;
    buttonLabel = t("location.tryEnablingAgain");
    buttonEvent = "LocationServicesDisabledRetryAuthorize";
  }

  return (
    <ServiceDisabledView
      title={t("location.titleServiceRequired")}
      TitleIcon={<NoLocationImage />}
      description={t("location.descriptionServiceRequired")}
      subTitle={t("location.noInfos")}
      hasBackButton={hasBackButton}
      ButtonIcon={ButtonIcon}
      buttonLabel={buttonLabel}
      onButtonPress={onButtonPress}
      buttonEvent={buttonEvent}
    />
  );
};

export default LocationDisabled;
