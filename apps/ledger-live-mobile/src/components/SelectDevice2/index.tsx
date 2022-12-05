import React, { useMemo, useCallback, useEffect, useState } from "react";
import { Linking, Platform } from "react-native";
import { Trans, useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { discoverDevices } from "@ledgerhq/live-common/hw/index";
import { CompositeScreenProps, useNavigation } from "@react-navigation/native";
import { Text, Flex, Icons, BottomDrawer } from "@ledgerhq/native-ui";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { useBleDevicesScanning } from "@ledgerhq/live-common/ble/hooks/useBleDevicesScanning";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";

import { urls } from "../../config/urls";
import TransportBLE from "../../react-native-hw-transport-ble";
import { track } from "../../analytics";
import { NavigatorName, ScreenName } from "../../const";
import { knownDevicesSelector } from "../../reducers/ble";
import Touchable from "../Touchable";
import Item from "./Item";
import { saveBleDeviceName } from "../../actions/ble";
import { setHasConnectedDevice } from "../../actions/appstate";
import {
  setLastConnectedDevice,
  setReadOnlyMode,
} from "../../actions/settings";
import {
  BaseComposite,
  StackNavigatorProps,
} from "../RootNavigator/types/helpers";
import { ManagerNavigatorStackParamList } from "../RootNavigator/types/ManagerNavigator";
import { MainNavigatorParamList } from "../RootNavigator/types/MainNavigator";
import { NavigateInput } from "../RootNavigator/types/BaseNavigator";

type Navigation = BaseComposite<
  CompositeScreenProps<
    StackNavigatorProps<ManagerNavigatorStackParamList>,
    StackNavigatorProps<MainNavigatorParamList>
  >
>;

type Props = {
  onSelect: (_: Device) => void;
  // This component has side-effects because it uses a BLE scanning hook.
  // And the scanning can only occur when LLM is not communicating with a device.
  // Other component using this component needs to stop the BLE scanning before starting
  // to communicate to a device via BLE.
  stopBleScanning: boolean;
};

export default function SelectDevice({ onSelect, stopBleScanning }: Props) {
  const [USBDevice, setUSBDevice] = useState<Device | undefined>();
  const [ProxyDevice, setProxyDevice] = useState<Device | undefined>();

  const dispatch = useDispatch();

  const [isAddNewDrawerOpen, setIsAddNewDrawerOpen] = useState<boolean>(false);

  const { t } = useTranslation();

  const buyDeviceFromLive = useFeature("buyDeviceFromLive");
  const knownDevices = useSelector(knownDevicesSelector);
  const navigation = useNavigation<Navigation["navigation"]>();
  const { scannedDevices } = useBleDevicesScanning({
    bleTransportListen: TransportBLE.listen,
    stopBleScanning,
  });

  const handleOnSelect = useCallback(
    (device: Device) => {
      const { modelId, wired } = device;

      track("Device selection", {
        modelId,
        connectionType: wired ? "USB" : "BLE",
      });
      dispatch(setLastConnectedDevice(device));
      dispatch(setHasConnectedDevice(true));
      onSelect(device);
      dispatch(setReadOnlyMode(false));
    },
    [dispatch, onSelect],
  );

  useEffect(() => {
    const filter = ({ id }: { id: string }) =>
      ["hid", "httpdebug"].includes(id);
    const sub = discoverDevices(filter).subscribe(e => {
      const setDevice = e.id.startsWith("hid") ? setUSBDevice : setProxyDevice;

      if (e.type === "remove") setDevice(undefined);
      if (e.type === "add") {
        const { name, deviceModel, id, wired } = e;
        setDevice({
          deviceName: name,
          modelId: deviceModel?.id,
          deviceId: id,
          wired,
        } as Device);
      }
    });
    return () => sub.unsubscribe();
  }, []);

  const deviceList = useMemo(() => {
    const devices: Device[] = knownDevices
      .map(device => {
        const equivalentScannedDevice = scannedDevices.find(
          ({ deviceId }) => device.id === deviceId,
        );

        return {
          ...device,
          wired: false,
          deviceId: device.id,
          deviceName: equivalentScannedDevice?.deviceName ?? device.name,
          available: Boolean(equivalentScannedDevice),
          // TODO add rsi strength from the BIM pr.
        } as Device & { available: boolean };
      })
      .sort((a, b) => Number(b.available) - Number(a.available));

    if (USBDevice) {
      devices.push(USBDevice);
    }
    if (ProxyDevice) {
      devices.push(ProxyDevice);
    }

    return devices;
  }, [knownDevices, scannedDevices, USBDevice, ProxyDevice]);

  // update device name on store when needed
  useEffect(() => {
    knownDevices.forEach(knownDevice => {
      const equivalentScannedDevice = scannedDevices.find(
        ({ deviceId }) => knownDevice.id === deviceId,
      );

      if (
        equivalentScannedDevice?.deviceName &&
        knownDevice.name !== equivalentScannedDevice.deviceName
      ) {
        dispatch(
          saveBleDeviceName(
            knownDevice.id,
            equivalentScannedDevice?.deviceName,
          ),
        );
      }
    });
  }, [dispatch, knownDevices, scannedDevices]);

  const onAddNewPress = useCallback(() => setIsAddNewDrawerOpen(true), []);

  const onBuyDevicePress = useCallback(() => {
    if (buyDeviceFromLive?.enabled) {
      navigation.navigate(NavigatorName.BuyDevice, {
        screen: ScreenName.PurchaseDevice,
      });
    } else {
      Linking.openURL(urls.buyNanoX);
    }
  }, [navigation, buyDeviceFromLive?.enabled]);

  const onPairDevices = useCallback(() => {
    const navigateInput: NavigateInput<
      MainNavigatorParamList,
      NavigatorName.Manager
    > = {
      name: NavigatorName.Manager,
      params: {
        screen: ScreenName.Manager,
        params: {
          device: null,
        },
      },
    };
    navigation.navigate(ScreenName.BleDevicePairingFlow, {
      areKnownDevicesDisplayed: true,
      onSuccessAddToKnownDevices: true,
      onSuccessNavigateToConfig: {
        navigateInput,
        pathToDeviceParam: "params.params.device",
      },
    });
  }, [navigation]);

  const onSetUpNewDevice = useCallback(() => {
    navigation.navigate(NavigatorName.BaseOnboarding, {
      screen: NavigatorName.Onboarding,
      params: {
        screen: ScreenName.OnboardingDeviceSelection,
      },
    });
  }, [navigation]);

  return (
    <Flex mt={20} pb={100}>
      <Flex
        flexDirection="row"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Flex>
          <Text variant="h5" fontWeight="semiBold">
            <Trans i18nKey="manager.selectDevice.saved.title" />
          </Text>
          <Text color="neutral.c80" variant="paragraph">
            <Trans i18nKey="manager.selectDevice.saved.description" />
          </Text>
        </Flex>
        {deviceList.length > 0 && (
          <Touchable onPress={onAddNewPress}>
            <Flex flexDirection="row" alignItems="center">
              <Text color="primary.c90" mr={3}>
                <Trans i18nKey="manager.selectDevice.addNewCTA" />
              </Text>
              <Icons.PlusMedium color="primary.c90" size={14} />
            </Flex>
          </Touchable>
        )}
      </Flex>
      <Flex my={4}>
        {deviceList.length > 0 ? (
          deviceList.map(device => (
            <Item
              key={device.deviceId}
              device={device as Device}
              onPress={handleOnSelect}
            />
          ))
        ) : (
          <Touchable onPress={onAddNewPress}>
            <Flex
              p={5}
              borderRadius={5}
              flexDirection="row"
              alignItems="center"
              borderColor="neutral.c40"
              borderStyle="dashed"
              borderWidth="1px"
            >
              <Icons.PlusMedium color="neutral.c90" size={20} />
              <Text variant="large" fontWeight="semiBold" ml={5}>
                {t("manager.selectDevice.addNewCTA")}
              </Text>
            </Flex>
          </Touchable>
        )}
      </Flex>
      {deviceList.length === 0 && Platform.OS === "android" && (
        <Flex
          p={5}
          borderRadius={5}
          alignItems="center"
          flexDirection="row"
          backgroundColor="primary.c10"
        >
          <Icons.InfoAltFillMedium color="primary.c80" size={20} />
          <Text
            color="neutral.c100"
            variant="large"
            fontWeight="semiBold"
            fontSize={4}
            ml={5}
            mr={3}
            lineHeight="21px"
          >
            <Trans i18nKey="manager.selectDevice.otgBanner" />
          </Text>
        </Flex>
      )}
      <Flex alignItems="center" mt={8}>
        <Touchable onPress={onBuyDevicePress}>
          <Text color="primary.c90">
            <Trans i18nKey="manager.selectDevice.buyDeviceCTA" />
          </Text>
        </Touchable>
      </Flex>
      <BottomDrawer
        isOpen={isAddNewDrawerOpen}
        onClose={() => setIsAddNewDrawerOpen(false)}
      >
        <Flex>
          <Touchable onPress={onSetUpNewDevice}>
            <Flex
              backgroundColor="neutral.c30"
              mb={4}
              px={6}
              py={7}
              borderRadius={8}
            >
              <Flex flexDirection="row">
                <Flex flexShrink={1}>
                  <Text variant="large" fontWeight="semiBold" mb={3}>
                    {t("manager.selectDevice.setUpNewLedger")}
                  </Text>
                  <Text variant="paragraph" color="neutral.c80">
                    {t("manager.selectDevice.setUpNewLedgerDescription")}
                  </Text>
                </Flex>
                <Flex justifyContent="center" alignItems="center" ml={5} mr={2}>
                  <Flex
                    borderRadius="9999px"
                    backgroundColor="primary.c20"
                    p={4}
                  >
                    <Icons.PlusMedium color="primary.c80" size={24} />
                  </Flex>
                </Flex>
              </Flex>
            </Flex>
          </Touchable>
          <Touchable onPress={onPairDevices}>
            <Flex backgroundColor="neutral.c30" px={6} py={7} borderRadius={8}>
              <Flex flexDirection="row">
                <Flex flexShrink={1}>
                  <Text variant="large" fontWeight="semiBold" mb={3}>
                    {t("manager.selectDevice.connectExistingLedger")}
                  </Text>
                  <Text variant="paragraph" color="neutral.c80">
                    {t("manager.selectDevice.connectExistingLedgerDescription")}
                  </Text>
                </Flex>
                <Flex justifyContent="center" alignItems="center" ml={5} mr={2}>
                  <Flex
                    borderRadius="9999px"
                    backgroundColor="primary.c20"
                    p={4}
                  >
                    <Icons.BluetoothMedium color="primary.c80" size={24} />
                  </Flex>
                </Flex>
              </Flex>
            </Flex>
          </Touchable>
        </Flex>
      </BottomDrawer>
    </Flex>
  );
}
