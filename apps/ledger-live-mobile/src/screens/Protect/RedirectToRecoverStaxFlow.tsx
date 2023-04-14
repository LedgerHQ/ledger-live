import React, { useEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { BaseNavigatorStackParamList } from "../../components/RootNavigator/types/BaseNavigator";
import {
  RootComposite,
  StackNavigatorProps,
} from "../../components/RootNavigator/types/helpers";
import { NavigatorName, ScreenName } from "../../const";
import { useNavigationInterceptor } from "../Onboarding/onboardingContext";

type NavigationProps = RootComposite<
  StackNavigatorProps<
    BaseNavigatorStackParamList,
    ScreenName.RedirectToOnboardingRecoverFlow
  >
>;

export function RedirectToRecoverStaxFlowScreen() {
  const { replace } = useNavigation<NavigationProps["navigation"]>();
  const { setShowWelcome, setFirstTimeOnboarding } = useNavigationInterceptor();

  useEffect(() => {
    setShowWelcome(false);
    setFirstTimeOnboarding(false);
    replace(NavigatorName.Base, {
      screen: ScreenName.BleDevicePairingFlow,
      params: {
        filterByDeviceModelId: DeviceModelId.stax,
        areKnownDevicesDisplayed: true,
        onSuccessAddToKnownDevices: false,
        isRecoverFlow: true,
        // `onSuccessNavigateToConfig` will never be used when `isRecoverFlow: true`
        onSuccessNavigateToConfig: {
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
  }, [replace, setFirstTimeOnboarding, setShowWelcome]);

  return <></>;
}
