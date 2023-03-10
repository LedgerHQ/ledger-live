import React from "react";
import { useAndroidEnableLocation } from "./hooks/useAndroidEnableLocation";
import LocationDisabled from "./LocationDisabled";

type Props = {
  children?: React.ReactNode;
  forceOpenSettingsOnErrorButton?: boolean;
};

/**
 * Renders an error if location is required but is not enabled.
 * Otherwise renders children.
 *
 * Can only be used on Android.
 *
 * @param forceOpenSettingsOnErrorButton Used mainly for debug purposes. If true, on a location disabled, pressing the button on
 *   the error component will make the user go to the settings. Otherwise it will try to prompt the user to enable their location
 *   services if possible. Defaults to false.
 */
const AndroidRequiresLocationEnabled: React.FC<Props> = ({
  children,
  forceOpenSettingsOnErrorButton = false,
}) => {
  const { locationServicesState, checkAndRequestAgain } =
    useAndroidEnableLocation();

  if (locationServicesState === "disabled") {
    return (
      <LocationDisabled
        onRetry={checkAndRequestAgain}
        forceOpenSettings={forceOpenSettingsOnErrorButton}
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
