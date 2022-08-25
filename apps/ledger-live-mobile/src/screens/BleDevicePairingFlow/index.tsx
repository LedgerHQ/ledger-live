import React, { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { ScannedDevice } from "@ledgerhq/live-common/ble/types";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { StackScreenProps } from "@react-navigation/stack";
import { SafeAreaView } from "react-native-safe-area-context";
import { Flex } from "@ledgerhq/native-ui";
import type { BaseNavigatorStackParamList } from "../../components/RootNavigator/BaseNavigator";
import RequiresBLE from "../../components/RequiresBLE";
import { BleDevicesScanning } from "./BleDeviceScanning";
import { BleDevicePairing } from "./BleDevicePairing";
import { addKnownDevice } from "../../actions/ble";

const DEFAULT_NAVIGATE_TO_DEVICE_ID_PARAM_NAME = "pairedDevice";

export type BleDevicePairingFlowParams = {
  filterByDeviceModelId?: DeviceModelId;
  areKnownDevicesDisplayed?: boolean;
  onSuccessAddToKnownDevices?: boolean;
  onSuccessNavigateToConfig: {
    screenName: string;
    navigatorName: string;
    pairedDeviceParamName?: string;
    otherParams: object | undefined; // Record<string, unknown>;
  };
};

export type BleDevicePairingFlowProps = StackScreenProps<
  BaseNavigatorStackParamList,
  "BleDevicePairingFlow"
>;

/**
 * Screen handling the BLE flow with a scanning step and a pairing step
 * @param navigation react-navigation navigation object
 * @param route react-navigation route object. The route params are:
 * - filterByDeviceModelId: a device model id to filter on
 * - areKnownDevicesDisplayed: boolean, display the already known device if true,
 *   filter out them if false (default to true)
 * - onSuccessNavigateToConfig: object containing navigation config parameters when successful pairing:
 *   - screenName: screen name of the screen to navigate to after pairing
 *   - navigatorName: necessary navigator name of the screen to navigate to
 *   - pairedDeviceParamName: param field name in which the newly paired device will be set.
 *     Default to "pairedDevice".
 *   - otherParams: other necessay params of the screen to nagitate to
 * - onSuccessAddToKnownDevices: boolean, if true the successfully paired device is added to the redux
 *   list of known devices. Not added if false (default to false).
 * @returns a JSX component
 */
export const BleDevicePairingFlow = ({
  navigation,
  route,
}: BleDevicePairingFlowProps) => {
  const dispatchRedux = useDispatch();

  const {
    filterByDeviceModelId,
    areKnownDevicesDisplayed = true,
    onSuccessAddToKnownDevices = false,
    onSuccessNavigateToConfig: {
      screenName: navigateToScreenName,
      navigatorName: navigateToNavigatorName,
      pairedDeviceParamName:
        navigateToPairedDeviceParamName = DEFAULT_NAVIGATE_TO_DEVICE_ID_PARAM_NAME,
      otherParams: navigateToOtherParams,
    },
  } = route.params;
  const [deviceToPair, setDeviceToPair] = useState<Device | null>(null);

  const onDeviceSelect = useCallback((item: ScannedDevice) => {
    const deviceToPair = {
      deviceId: item.deviceId,
      deviceName: item.deviceName,
      modelId: item.deviceModel.id,
      wired: false,
    };

    setDeviceToPair(deviceToPair);
  }, []);

  const onPaired = useCallback(
    (device: Device) => {
      if (onSuccessAddToKnownDevices) {
        dispatchRedux(
          addKnownDevice({
            id: device.deviceId,
            name: device.deviceName ?? device.modelId,
            modelId: device.modelId,
          }),
        );
      }

      navigation.navigate(navigateToNavigatorName, {
        screen: navigateToScreenName,
        params: {
          ...navigateToOtherParams,
          [navigateToPairedDeviceParamName]: device,
        },
      });
    },
    [
      dispatchRedux,
      navigateToNavigatorName,
      navigateToOtherParams,
      navigateToPairedDeviceParamName,
      navigateToScreenName,
      navigation,
      onSuccessAddToKnownDevices,
    ],
  );

  const onRetryPairingFlow = useCallback(() => {
    setDeviceToPair(null);
  }, []);

  return (
    <RequiresBLE>
      <SafeAreaView>
        <Flex bg="background.main" height="100%">
          {deviceToPair ? (
            <BleDevicePairing
              deviceToPair={deviceToPair}
              onPaired={onPaired}
              onRetry={onRetryPairingFlow}
            />
          ) : (
            <BleDevicesScanning
              filterByDeviceModelId={filterByDeviceModelId}
              areKnownDevicesDisplayed={areKnownDevicesDisplayed}
              onDeviceSelect={onDeviceSelect}
            />
          )}
        </Flex>
      </SafeAreaView>
    </RequiresBLE>
  );
};
