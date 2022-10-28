import React, { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { has as hasFromPath, set as setFromPath } from "lodash";
import type { PropertyPath } from "lodash";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { StackScreenProps } from "@react-navigation/stack";
import type { BaseNavigatorStackParamList } from "../../components/RootNavigator/BaseNavigator";
import RequiresBLE from "../../components/RequiresBLE";
import { BleDevicesScanning } from "./BleDevicesScanning";
import { BleDevicePairing } from "./BleDevicePairing";
import { addKnownDevice } from "../../actions/ble";
import { NavigatorName, ScreenName } from "../../const";

export type NavigateInput = {
  name: string;
  params: object;
};

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

export type PathToDeviceParam = PropertyPath;
export type NavigationType = "navigate" | "replace" | "push";

export type BleDevicePairingFlowParams = {
  filterByDeviceModelId?: DeviceModelId;
  areKnownDevicesDisplayed?: boolean;
  onSuccessAddToKnownDevices?: boolean;
  onSuccessNavigateToConfig: {
    navigateInput: NavigateInput;
    pathToDeviceParam: PathToDeviceParam;
    navigationType?: NavigationType;
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
export const BleDevicePairingFlow = ({
  navigation,
  route,
}: BleDevicePairingFlowProps) => {
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

      if (navigationType === "push") {
        navigation.push(navigateInput.name, { ...navigateInput.params });
      } else if (navigationType === "replace") {
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
