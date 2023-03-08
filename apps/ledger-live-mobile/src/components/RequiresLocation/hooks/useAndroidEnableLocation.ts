import { useCallback, useEffect, useState } from "react";
import {
  EmitterSubscription,
  NativeEventEmitter,
  NativeModules,
  Platform,
} from "react-native";
import { log } from "@ledgerhq/logs";
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
  return useCallback(async (): Promise<
    CheckAndRequestResponse | "LOCATION_MODULE_THREW_ERROR"
  > => {
    try {
      if (Platform.OS === "android") {
        const response =
          await LocationHelperModule.checkAndRequestEnablingLocationServices();
        return response;
      }

      return "ERROR_UNKNOWN";
    } catch (e) {
      // Should never be reached, a checkAndRequestEnablingLocationServices only resolves.
      // But if the module LocationHelperModule get changed/removed, it could be reached.
      let errorMessage = "Unknown error was thrown by LocationHelperModule";
      if (e instanceof Error) {
        errorMessage = `{e.name}: {e.message}`;
      }

      log("useAndroidPromptEnableLocationCallback:error", `${errorMessage}`);

      return "LOCATION_MODULE_THREW_ERROR";
    }
  }, []);
}

export type LocationServicesState = "unknown" | "enabled" | "disabled";

export type UseAndroidEnableLocationArgs = {
  isHookEnabled?: boolean;
};

/**
 * Hook to enable the locations services.
 *
 * A method is exposed to check the location services state and request (if necessary) the user to enable them.
 * This method is called a first time on mount.
 * It also listens to an update of the location services state from the native module, and updates the state accordingly.
 *
 * Only available on Android.
 *
 * @param isHookEnabled if false, the hook will not check/request the location services, and will not listen to an update
 * of the locations services state from the native module. Defaults to true.
 *
 * @returns an object containing:
 * - checkAndRequestAgain: a function that checks the location services state and requests (if necessary) the user to enable them
 * - locationServicesState: a state that indicates if the location services are enabled or not
 */
export function useAndroidEnableLocation(
  { isHookEnabled = true }: UseAndroidEnableLocationArgs = {
    isHookEnabled: true,
  },
) {
  const promptEnableLocation = useAndroidPromptEnableLocationCallback();

  const [locationServicesState, setLocationServicesState] =
    useState<LocationServicesState>("unknown");

  // Exposes a check and request enabling location services again (if needed)
  // First way to update locationServicesState.
  const checkAndRequestAgain = useCallback(async () => {
    if (!isHookEnabled) return;

    const response = await promptEnableLocation();

    if (
      response === "SUCCESS_LOCATION_ENABLED" ||
      response === "SUCCESS_LOCATION_ALREADY_ENABLED"
    ) {
      setLocationServicesState("enabled");
    } else {
      setLocationServicesState("disabled");
    }
  }, [isHookEnabled, promptEnableLocation]);

  // Checks and requests on mount
  useEffect(() => {
    if (!isHookEnabled) return;

    checkAndRequestAgain();
  }, [checkAndRequestAgain, isHookEnabled]);

  // Listens to an update of the locations services state from the native module.
  // Second way to update locationServicesState.
  useEffect(() => {
    let eventListener: null | EmitterSubscription;

    if (isHookEnabled) {
      const eventEmitter = new NativeEventEmitter(
        NativeModules.LocationHelperModule,
      );
      eventListener = eventEmitter.addListener(
        "LocationServiceUpdated",
        event => {
          if (event?.service === "enabled") {
            setLocationServicesState("enabled");
          } else if (event?.service === "disabled") {
            setLocationServicesState("disabled");
          }
        },
      );
    }

    return () => {
      if (eventListener) {
        eventListener.remove();
      }
    };
  }, [isHookEnabled]);

  return { locationServicesState, checkAndRequestAgain };
}
