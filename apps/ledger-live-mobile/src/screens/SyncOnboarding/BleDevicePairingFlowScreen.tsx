import React, { useCallback, useEffect } from "react";
import { BackHandler } from "react-native";
import { StackScreenProps } from "@react-navigation/stack";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { CommonActions } from "@react-navigation/native";
import BleDevicePairingFlow from "../../components/BleDevicePairingFlow/index";
import { NavigatorName, ScreenName } from "../../const";
import { useIncrementOnNavigationFocusState } from "../../helpers/useIncrementOnNavigationFocusState";
import { BaseComposite } from "../../components/RootNavigator/types/helpers";
import { SyncOnboardingStackParamList } from "../../components/RootNavigator/types/SyncOnboardingNavigator";

// Maybe the CompositeScreenProps is not necessary if the reset works with CommonActions.reset
// type Props = BaseComposite<
//   CompositeScreenProps<
//     StackScreenProps<
//       SyncOnboardingStackParamList,
//       ScreenName.SyncOnboardingBleDevicePairingFlow
//     >,
//     StackScreenProps<OnboardingNavigatorParamList>
//   >
// >;

type Props = BaseComposite<
  StackScreenProps<
    SyncOnboardingStackParamList,
    ScreenName.SyncOnboardingBleDevicePairingFlow
  >
>;

// TODO: Might need default config for the deeplink

/**
 * Screen handling the BLE flow with a scanning step and a pairing step
 *
 * @param navigation react-navigation navigation object
 * @param route react-navigation route object. The route params are:
 * - filterByDeviceModelId: (optional, default to none) a device model id to filter on
 * - areKnownDevicesDisplayed: boolean, display the already known device if true,
 *   filter out them if false (default to true)
 * - onPairingSuccessAddToKnownDevices: boolean, if true the successfully paired device is added to the redux
 *   list of known devices. Not added if false (default to false).
 */
export const BleDevicePairingFlowScreen = ({ navigation, route }: Props) => {
  const params = route?.params;

  // TODO: fix type
  const keyToReset =
    useIncrementOnNavigationFocusState<Props["navigation"]>(navigation);

  const { filterByDeviceModelId = undefined, areKnownDevicesDisplayed = true } =
    params;

  // TODO: don't know if useful yet
  // TODO: to test
  // Handles the case when the user comes from the deep link
  const handleGoBackFromScanning = useCallback(() => {
    const routes = navigation.getState().routes;

    const isNavigationFromDeeplink =
      routes[routes.length - 1]?.params === undefined;

    if (!isNavigationFromDeeplink) {
      navigation.goBack();
    } else {
      navigation.navigate(NavigatorName.BaseOnboarding, {
        screen: NavigatorName.Onboarding,
        params: {
          screen: ScreenName.OnboardingWelcome,
        },
      });

      // TODO: to test
      // Resets using dispatch and CommonActions due to hard to infer
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [
            {
              name: NavigatorName.BaseOnboarding,
              state: {
                routes: [
                  {
                    name: NavigatorName.Onboarding,
                    state: {
                      routes: [
                        {
                          name: ScreenName.OnboardingWelcome,
                        },
                      ],
                    },
                  },
                ],
              },
            },
          ],
        }),
      );
    }
  }, [navigation]);

  // Handles back button, necessary when the user comes from the deep link
  useEffect(() => {
    const listener = BackHandler.addEventListener("hardwareBackPress", () => {
      handleGoBackFromScanning();
      return true;
    });

    return () => listener.remove();
  }, [handleGoBackFromScanning]);

  const onPairingSuccess = useCallback(
    (device: Device) => {
      // TODO: to re-test
      // navigation.push on stack navigation because with navigation.navigate
      // it could not go back to this screen in certain cases.
      navigation.push(ScreenName.SyncOnboardingCompanion, { device });
    },
    [navigation],
  );

  console.log(`🕵️ BleDevicePairingFlowScreen: keyToReset: ${keyToReset}`);

  return (
    <BleDevicePairingFlow
      key={keyToReset}
      filterByDeviceModelId={filterByDeviceModelId}
      areKnownDevicesDisplayed={areKnownDevicesDisplayed}
      onGoBackFromScanning={handleGoBackFromScanning}
      onPairingSuccess={onPairingSuccess}
      onPairingSuccessAddToKnownDevices={false}
    />
  );
};
