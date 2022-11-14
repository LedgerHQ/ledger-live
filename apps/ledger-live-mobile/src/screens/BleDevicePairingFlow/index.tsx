import React, { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { has as hasFromPath, set as setFromPath } from "lodash";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { DeviceModelId } from "@ledgerhq/types-devices";
import RequiresBLE from "../../components/RequiresBLE";
import { BleDevicesScanning } from "./BleDevicesScanning";
import { BleDevicePairing } from "./BleDevicePairing";
import { addKnownDevice } from "../../actions/ble";
import { NavigatorName, ScreenName } from "../../const";
import { BaseNavigatorStackParamList } from "../../components/RootNavigator/types/BaseNavigator";
import {
  RootComposite,
  StackNavigatorProps,
} from "../../components/RootNavigator/types/helpers";

export type Props = RootComposite<
  StackNavigatorProps<
    BaseNavigatorStackParamList,
    ScreenName.BleDevicePairingFlow
  >
>;

// Necessary when the pairing flow is opened from a deeplink without any params
// Shouldn't be relied upon for other usages
const defaultNavigationParams = {
  filterByDeviceModelId: DeviceModelId.nanoFTS, // This needs to be removed when nanos are supported
  areKnownDevicesDisplayed: true,
  onSuccessAddToKnownDevices: false,
  successNavigateToConfig: {
    navigationType: "navigate",
    pathToDeviceParam: "params.params.params.device",
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
  },
};

/**
 * Screen handling the BLE flow with a scanning step and a pairing step
 * @param navigation react-navigation navigation object
 * @param route react-navigation route object. The route params are:
 * - filterByDeviceModelId: (optional, default to none) a device model id to filter on
 * - areKnownDevicesDisplayed: boolean, display the already known device if true,
 *   filter out them if false (default to true)
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
 *   - navigationType: (optional, default to "navigate") when navigating after a successful pairing,
 *     choose between a "replace" or a "navigate"
 *   The default success config will navigate to the synchronous onboarding, however it shouldn't be
 *   relied upon and exist solely to simplify deeplinking to the sync onboarding.
 * - onSuccessAddToKnownDevices: boolean, if true the successfully paired device is added to the redux
 *   list of known devices. Not added if false (default to false).
 * @returns a JSX component
 */
export const BleDevicePairingFlow = ({ navigation, route }: Props) => {
  const dispatchRedux = useDispatch();

  const params = route?.params || defaultNavigationParams;

  const {
    filterByDeviceModelId = undefined,
    areKnownDevicesDisplayed = true,
    onSuccessAddToKnownDevices = false,
    onSuccessNavigateToConfig = defaultNavigationParams.successNavigateToConfig,
  } = params;

  const {
    navigateInput,
    pathToDeviceParam,
    navigationType = "navigate",
  } = onSuccessNavigateToConfig;

  const [deviceToPair, setDeviceToPair] = useState<Device | null>(null);

  const onDeviceSelect = useCallback((item: Device) => {
    const deviceToPair = {
      deviceId: item.deviceId,
      deviceName: item.deviceName,
      modelId: item.modelId,
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

      const params = navigateInput.params
        ? {
            ...navigateInput.params,
          }
        : undefined;

      if (navigationType === "push") {
        // @ts-expect-error this seems complicated to type properly
        // the typings for react-navigation cannot reconciliate screens having "undefined" params and object params
        navigation.push(navigateInput.name, params);
      } else if (navigationType === "replace") {
        // @ts-expect-error this seems complicated to type properly
        navigation.replace(navigateInput.name, params);
      } else {
        // @ts-expect-error this seems complicated to type properly
        navigation.navigate(navigateInput.name, params);
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
    </RequiresBLE>
  );
};
