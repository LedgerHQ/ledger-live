import { useEffect } from "react";
import { useNavigation } from "@react-navigation/native";

import { NavigatorName, ScreenName } from "../../const";
import { useTermsAccept } from "../../logic/terms";

export const BleDevicePairingDeeplinkRedirection = () => {
  const navigation = useNavigation();
  const [acceptedTerms] = useTermsAccept();

  useEffect(() => {
    if (acceptedTerms) {
      navigation.replace(NavigatorName.Base as "Base", {
        screen: ScreenName.BleDevicePairingFlow as "BleDevicePairingFlow",
        params: {
          // TODO: for now we remove this
          // filterByDeviceModelId: DeviceModelId.nanoFTS,
          areKnownDevicesDisplayed: false,
          onSuccessAddToKnownDevices: false,
          onSuccessNavigateToConfig: {
            // navigation.push on success because it could not correctly
            // go back to the previous screens (BLE and then this screen).
            navigationType: "push",
            navigateInput: {
              name: NavigatorName.BaseOnboarding,
              params: {
                screen: NavigatorName.SyncOnboarding,
                params: {
                  screen: ScreenName.SyncOnboardingCompanion,
                  params: {
                    device: null,
                  },
                },
              },
            },
            pathToDeviceParam: "params.params.params.device",
          },
        },
      });
    } else {
      navigation.replace(ScreenName.OnboardingWelcome);
    }
  }, [acceptedTerms, navigation]);

  return null;
};

export default BleDevicePairingDeeplinkRedirection;
