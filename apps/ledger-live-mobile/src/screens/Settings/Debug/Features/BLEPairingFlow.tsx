import { useNavigation, useRoute } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import {
  Text,
  Icons,
  Button,
  SelectableList,
  Switch,
  Flex,
} from "@ledgerhq/native-ui";
import { DeviceModelId } from "@ledgerhq/types-devices";

import SettingsRow from "../../../../components/SettingsRow";
import { NavigatorName, ScreenName } from "../../../../const";
import type { SettingsNavigatorStackParamList } from "../../../../components/RootNavigator/types/SettingsNavigator";
import type {
  BaseNavigatorStackParamList,
  NavigateInput,
} from "../../../../components/RootNavigator/types/BaseNavigator";
import {
  StackNavigatorNavigation,
  StackNavigatorRoute,
} from "../../../../components/RootNavigator/types/helpers";
import QueuedDrawer from "../../../../components/QueuedDrawer";

const availableDeviceModelFilter = [
  "none",
  DeviceModelId.nanoX,
  DeviceModelId.stax,
] as const;
type AvailableDeviceModelFilter = typeof availableDeviceModelFilter[number];

export default () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [chosenDeviceModelFilter, setChosenDeviceModelFilter] =
    useState<AvailableDeviceModelFilter>("none");
  const [areKnownDevicesDisplayed, setAreKnownDevicesDisplayed] =
    useState<boolean>(false);
  const [onSuccessAddToKnownDevices, setOnSuccessAddToKnownDevices] =
    useState<boolean>(false);
  const navigation =
    useNavigation<
      StackNavigatorNavigation<
        BaseNavigatorStackParamList,
        ScreenName.DebugSettings
      >
    >();

  // Example using the route to get the current screen name and any params
  // But no current way to get the navigator name (even from the navigation state)
  const { name: screenName, params } =
    useRoute<
      StackNavigatorRoute<
        SettingsNavigatorStackParamList,
        ScreenName.DebugSettings
      >
    >();
  const { pairedDevice } = params ?? {
    pairedDevice: null,
  };

  const goToBlePairingFlow = useCallback(() => {
    setIsDrawerOpen(false);

    // To avoid an unsuccesful return that would keep the current (if any) paired device object
    // This cleaning strategy would depend on the use case.
    const newParams = { ...params, pairedDevice: null };
    // @ts-expect-error react navigation does not like having undefined as possible params
    navigation.setParams(newParams);

    const navigateInput: NavigateInput<
      BaseNavigatorStackParamList,
      NavigatorName.Settings
    > = {
      name: NavigatorName.Settings,
      params: {
        screen: screenName,
        params: {
          ...newParams,
        },
      },
    };
    navigation.navigate(ScreenName.BleDevicePairingFlow, {
      filterByDeviceModelId:
        chosenDeviceModelFilter === "none"
          ? undefined
          : chosenDeviceModelFilter,
      areKnownDevicesDisplayed,
      onSuccessAddToKnownDevices,
      onSuccessNavigateToConfig: {
        navigateInput,
        pathToDeviceParam: "params.params.pairedDevice",
      },
    });
  }, [
    params,
    navigation,
    screenName,
    chosenDeviceModelFilter,
    areKnownDevicesDisplayed,
    onSuccessAddToKnownDevices,
  ]);

  const onPress = useCallback(() => {
    setIsDrawerOpen(true);
  }, []);

  const onCloseDrawer = useCallback(() => {
    setIsDrawerOpen(false);
  }, []);

  const onChangeDeviceModelFilter = useCallback(
    (value: AvailableDeviceModelFilter) => {
      setChosenDeviceModelFilter(value);
    },
    [],
  );

  const onChangeDisplayKnownDevices = useCallback((value: boolean) => {
    setAreKnownDevicesDisplayed(value);
  }, []);

  const onChangeAddToKnownDevices = useCallback((value: boolean) => {
    setOnSuccessAddToKnownDevices(value);
  }, []);

  return (
    <SettingsRow
      title="BLE Pairing flow"
      iconLeft={<Icons.BluetoothMedium size={32} color="black" />}
      onPress={onPress}
      desc={`Paired device: ${
        pairedDevice?.deviceName ?? pairedDevice?.deviceId ?? "no device"
      }`}
    >
      <QueuedDrawer
        isRequestingToBeOpened={isDrawerOpen}
        onClose={onCloseDrawer}
      >
        <Flex mb="8">
          <Text variant="body" mb="8">
            Choose which device model to filter on:
          </Text>

          <SelectableList
            currentValue={chosenDeviceModelFilter}
            onChange={onChangeDeviceModelFilter}
          >
            {availableDeviceModelFilter.map((value, index) => (
              <SelectableList.Element key={value + index} value={value}>
                {value}
              </SelectableList.Element>
            ))}
          </SelectableList>
        </Flex>
        <Flex mb="8">
          <Switch
            label="Display already known device ?"
            onChange={onChangeDisplayKnownDevices}
            checked={areKnownDevicesDisplayed}
          />
        </Flex>
        <Flex mb="8">
          <Switch
            label="Add to known devices list on successful paired ?"
            onChange={onChangeAddToKnownDevices}
            checked={onSuccessAddToKnownDevices}
          />
        </Flex>
        <Button type="color" onPress={goToBlePairingFlow}>
          Go to pairing flow
        </Button>
      </QueuedDrawer>
    </SettingsRow>
  );
};
