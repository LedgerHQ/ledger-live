import React, { useCallback } from "react";
import { StackScreenProps } from "@react-navigation/stack";
import { Device } from "@ledgerhq/live-common/hw/actions/types";

import BleDevicePairingFlow from "../../components/BleDevicePairingFlow/index";

import { ScreenName } from "../../const";
import { BaseComposite } from "../../components/RootNavigator/types/helpers";
import { SyncOnboardingStackParamList } from "../../components/RootNavigator/types/SyncOnboardingNavigator";
import { useIncrementOnNavigationFocusState } from "../../helpers/useIncrementOnNavigationFocusState copy";

type Props = BaseComposite<
  StackScreenProps<
    SyncOnboardingStackParamList,
    ScreenName.SyncOnboardingBleDevicePairingFlow
  >
>;

// TODO: Not sure yet if filterByDeviceModelId, areKnownDevicesDisplayed and onSuccessAddToKnownDevices are all necessary for the screen
// TODO: Might need default config for the deeplink

/**
 * Screen handling the BLE flow with a scanning step and a pairing step
 * @param navigation react-navigation navigation object
 * @param route react-navigation route object. The route params are:
 * - filterByDeviceModelId: (optional, default to none) a device model id to filter on
 * - areKnownDevicesDisplayed: boolean, display the already known device if true,
 *   filter out them if false (default to true)
 * - onSuccessAddToKnownDevices: boolean, if true the successfully paired device is added to the redux
 *   list of known devices. Not added if false (default to false).
 * @returns a JSX component
 */
export const BleDevicePairingFlowScreen = ({ navigation, route }: Props) => {
  const params = route?.params;

  // TODO: fix type
  const keyToReset =
    useIncrementOnNavigationFocusState<Props["navigation"]>(navigation);

  const {
    filterByDeviceModelId = undefined,
    areKnownDevicesDisplayed = true,
    onSuccessAddToKnownDevices = true,
  } = params;

  const onSuccess = useCallback(
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
      onSuccess={onSuccess}
      filterByDeviceModelId={filterByDeviceModelId}
      areKnownDevicesDisplayed={areKnownDevicesDisplayed}
      onSuccessAddToKnownDevices={onSuccessAddToKnownDevices}
    />
  );
};
