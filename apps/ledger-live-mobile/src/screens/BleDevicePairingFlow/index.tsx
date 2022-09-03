import React, { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { has as hasFromPath, set as setFromPath } from "lodash";
import type { PropertyPath } from "lodash";
import { ScannedDevice } from "@ledgerhq/live-common/ble/types";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { StackScreenProps } from "@react-navigation/stack";
import { SafeAreaView } from "react-native-safe-area-context";
import { Flex } from "@ledgerhq/native-ui";
import type { BaseNavigatorStackParamList } from "../../components/RootNavigator/BaseNavigator";
import RequiresBLE from "../../components/RequiresBLE";
import { BleDevicesScanning } from "./BleDevicesScanning";
import { BleDevicePairing } from "./BleDevicePairing";
import { addKnownDevice } from "../../actions/ble";

export type NavigateInput = {
  name: string;
  params: object;
};

export type PathToDeviceParam = PropertyPath;
export type NavigationType = "navigate" | "replace";

export type BleDevicePairingFlowParams = {
  filterByDeviceModelId?: DeviceModelId;
  areKnownDevicesDisplayed?: boolean;
  onSuccessAddToKnownDevices?: boolean;
  navigationType?: NavigationType;
  onSuccessNavigateToConfig: {
    navigateInput: NavigateInput;
    pathToDeviceParam: PathToDeviceParam;
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
 * - filterByDeviceModelId: (optional, default to none) a device model id to filter on
 * - areKnownDevicesDisplayed: boolean, display the already known device if true,
 *   filter out them if false (default to true)
 * - navigationType: (optional, default to "navigate") when navigating after a successful pairing,
 *   choose between a "replace" or a "navigate"
 * - onSuccessNavigateToConfig: object containing navigation config parameters when successful pairing:
 *   - navigateInput: navigation object given as input to navigation.navigate. 2 mandatory props:
 *     - name: navigator name or screen name if no need to specify a navigator
 *     - params: navigation params
 *     Ex for a nested navigation:
 *      {
 * .      name: NavigatorName.A_NAVIGATOR,
 *        params: {
 *          screen: ScreenName.A_SCREEN,
 *          params: {
 *            ...SOME_PARAMS,
 *            pairedDevice: null,
 *          },
 *        },
 *      }
 *   - pathToDeviceParam: path to device property that is nested into navigateInput
 *     From the ex of navigateInput, it would be: "params.params.pairedDevice"
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
    navigationType = "navigate",
    onSuccessNavigateToConfig: { navigateInput, pathToDeviceParam },
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

      const hasDeviceParam = hasFromPath(navigateInput, pathToDeviceParam);
      if (hasDeviceParam) {
        setFromPath(navigateInput, pathToDeviceParam, device);
      } else {
        console.error(
          `BLE pairing flow: device path param ${String(
            pathToDeviceParam,
          )} not existing on navigation input`,
        );
      }

      // Before navigating, to never come back a the successful pairing but to the scanning part
      setDeviceToPair(null);

      if (navigationType === "replace") {
        navigation.replace(navigateInput.name, { ...navigateInput.params });
      } else {
        navigation.navigate(navigateInput);
      }
    },
    [
      dispatchRedux,
      navigateInput,
      navigation,
      navigationType,
      onSuccessAddToKnownDevices,
      pathToDeviceParam,
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
