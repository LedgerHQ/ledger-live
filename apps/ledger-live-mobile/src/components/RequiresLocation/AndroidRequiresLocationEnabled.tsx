import React from "react";
import { useAndroidEnableLocation } from "./hooks/useAndroidEnableLocation";
import LocationDisabled from "./LocationDisabled";

type Props = {
  children?: React.ReactNode;
  hasBackButtonOnError?: boolean;
  openSettingsOnErrorButton?: boolean;
};

/**
 * Renders an error if location is required but is not enabled.
 * Otherwise renders children.
 *
 * Can only be used on Android.
 *
 * @param hasBackButtonOnError If true, the back button will be displayed on the permission denied or disabled error screens.
 * Defaults to false.
 * @param openSettingsOnErrorButton Used for debug purposes. If true, on a location disabled, pressing the button on
 *   the error component will make the user go to the settings. Otherwise it will try to prompt the user to enable their location
 *   services if possible. Defaults to false.
 */
const AndroidRequiresLocationEnabled: React.FC<Props> = ({
  children,
  hasBackButtonOnError = false,
  openSettingsOnErrorButton = false,
}) => {
  const { locationServicesState, checkAndRequestAgain } =
    useAndroidEnableLocation();

  if (locationServicesState === "disabled") {
    return (
      <LocationDisabled
        hasBackButton={hasBackButtonOnError}
        onRetry={checkAndRequestAgain}
        openSettings={openSettingsOnErrorButton}
      />
    );
  }

  // To avoid flashing UI: when the location services were disabled, a prompt was shown, and the location services were enabled for ex.
  if (locationServicesState === "unknown") {
    return null;
  }

  return <>{children}</>;
};

export default AndroidRequiresLocationEnabled;
