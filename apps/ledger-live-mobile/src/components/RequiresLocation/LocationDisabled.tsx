import React, { useContext } from "react";
import { Linking, Platform } from "react-native";
import { useTranslation } from "react-i18next";

import NoLocationImage from "~/icons/NoLocationImage";
import GenericInformationalDrawerContent from "../GenericInformationalDrawerContent";
import GenericInformationalView from "../GenericInformationalView";
import IsInDrawerContext from "~/context/IsInDrawerContext";

type Props = {
  onRetry?: (() => void) | null;
  forceOpenSettings?: boolean;
};

/**
 * Renders a component that informs the user that they have disabled their location services.
 *
 * The default behavior to open the location native settings only works on Android.
 * This is fine because, currently, this type of error (location disabled) is only happening on Android.
 * Indeed, LLM does not need the location service on iOS.
 *
 * @param onRetry A callback for the user to retry enabling the service. If undefined or if forceOpenSettings is true,
 *   the user will be prompted to open the native settings.
 * @param forceOpenSettings Used mainly for debug purposes. If true pressing the button will make the user go to the settings. Defaults to false.
 */
const LocationDisabled: React.FC<Props> = ({ onRetry, forceOpenSettings = false }) => {
  const { t } = useTranslation();
  const { isInDrawer } = useContext(IsInDrawerContext);

  const openNativeLocationServicesSetting = () => {
    if (Platform.OS === "android") {
      Linking.sendIntent("android.settings.LOCATION_SOURCE_SETTINGS").catch(() =>
        Linking.openSettings(),
      );
    }
  };

  let onButtonPress;
  let buttonLabel;
  let buttonEvent;

  if (!onRetry || forceOpenSettings) {
    onButtonPress = openNativeLocationServicesSetting;
    buttonLabel = t("location.openSettings");
    buttonEvent = "LocationServicesDisabledOpenSettings";
  } else {
    onButtonPress = onRetry;
    buttonLabel = t("location.tryEnablingAgain");
    buttonEvent = "LocationServicesDisabledRetryAuthorize";
  }

  if (isInDrawer) {
    return (
      <GenericInformationalDrawerContent
        icon={<NoLocationImage viewBox="0 0 113 114" height="60" width="60" />}
        title={t("location.titleServiceRequired")}
        description={t("location.descriptionServiceRequired")}
        primaryButtonLabel={buttonLabel}
        onPrimaryButtonPress={onButtonPress}
        primaryButtonEvent={buttonEvent}
      />
    );
  }

  return (
    <GenericInformationalView
      title={t("location.titleServiceRequired")}
      icon={<NoLocationImage viewBox="0 0 113 114" height="60" width="60" />}
      description={t("location.descriptionServiceRequired")}
      subTitle={t("location.noInfos")}
      primaryButtonLabel={buttonLabel}
      onPrimaryButtonPress={onButtonPress}
      primaryButtonEvent={buttonEvent}
    />
  );
};

export default LocationDisabled;
