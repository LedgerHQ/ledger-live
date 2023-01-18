import { useCallback, useEffect, useState } from "react";
import { NativeEventEmitter, NativeModules, Platform } from "react-native";
import LocationHelperModule, {
  CheckAndRequestResponse,
} from "../../../native-modules/LocationHelperModule";

/**
 * Hook returning a callback that checks the location services state and requests (if necessary) the user to enable them
 *
 * If you want to enable the location services directly and/or keep track of the location services state, 
 * use useAndroidEnableLocation defined below.
 *
 * Only available on Android.
 *
 * @returns the callback
 */
export function useAndroidPromptEnableLocationCallback() {
  return useCallback(async (): Promise<CheckAndRequestResponse> => {
    try {
      if (Platform.OS === "android") {
        const response =
          await LocationHelperModule.checkAndRequestEnablingLocationServices();
        return response;
      }

      return "ERROR_UNKNOWN";
    } catch (e) {
      // Should never be reached, a checkAndRequestEnablingLocationServices only resolves
      return "ERROR_UNKNOWN";
    }
  }, []);
}

export type LocationServicesState = "unknown" | "enabled" | "disabled";

/**
 * Hook to enable the locations services
 *
 * A method is exposed to check the location services state and request (if necessary) the user to enable them.
 * This method is called on mounting.
 * It also listens to an update of the location services state from the native module, and updates the state accordingly.
 *
 * Only available on Android.
 *
 * @returns an object containing:
 * - checkAndRequestAgain: a function that checks the location services state and requests (if necessary) the user to enable them
 * - locationServicesState: a state that indicates if the location services are enabled or not
 */
export function useAndroidEnableLocation() {
  const promptEnableLocation = useAndroidPromptEnableLocationCallback();

  const [locationServicesState, setLocationServicesState] =
    useState<LocationServicesState>("unknown");

  // Exposes a check and request enabling location services again (if needed)
  // First way to update locationServicesState.
  const checkAndRequestAgain = useCallback(async () => {
    const response = await promptEnableLocation();

    if (
      response === "SUCCESS_LOCATION_ENABLED" ||
      response === "SUCCESS_LOCATION_ALREADY_ENABLED"
    ) {
      setLocationServicesState("enabled");
    } else {
      setLocationServicesState("disabled");
    }
  }, [promptEnableLocation]);

  useEffect(() => {
    checkAndRequestAgain();
  }, [checkAndRequestAgain]);

  // Listens to an update of the locations services state from the native module.
  // Second way to update locationServicesState.
  useEffect(() => {
    const eventEmitter = new NativeEventEmitter(
      NativeModules.LocationHelperModule,
    );
    const eventListener = eventEmitter.addListener(
      "LocationServiceUpdated",
      event => {
        if (event?.service === "enabled") {
          setLocationServicesState("enabled");
        } else if (event?.service === "disabled") {
          setLocationServicesState("disabled");
        }
      },
    );

    return () => {
      eventListener.remove();
    };
  }, []);

  return { locationServicesState, checkAndRequestAgain };
}
