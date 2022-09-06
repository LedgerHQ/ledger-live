import React, { useMemo, useCallback, useEffect, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { discoverDevices } from "@ledgerhq/live-common/hw/index";
import { useNavigation } from "@react-navigation/native";
import { Text, Flex, Icons } from "@ledgerhq/native-ui";
import { Device } from "@ledgerhq/live-common/lib/hw/actions/types";
import { useBleDevicesScanning } from "@ledgerhq/live-common/lib/ble/hooks/useBleDevicesScanning";

import TransportBLE from "../../react-native-hw-transport-ble";
import { NavigatorName, ScreenName } from "../../const";
import { knownDevicesSelector } from "../../reducers/ble";
import Touchable from "../Touchable";
import Item from "./Item";

type Props = {
  onSelect: (_: Device) => void;
};

export default function SelectDevice({ onSelect }: Props) {
  const [USBDevice, setUSBDevice] = useState<Device | undefined>();
  const [ProxyDevice, setProxyDevice] = useState<Device | undefined>();

  const { t } = useTranslation();

  const knownDevices = useSelector(knownDevicesSelector);
  const navigation = useNavigation();
  const { scannedDevices } = useBleDevicesScanning({
    bleTransportListen: TransportBLE.listen,
  });

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
      .map(
        device =>
          ({
            ...device,
            wired: false,
            deviceId: device.id,
            available: !!scannedDevices.find(
              ({ deviceId }) => device.id === deviceId,
            ),
            // TODO add rsi strength from the BIM pr.
          } as Device & { available: boolean }),
      )
      .sort((a, b) => Number(b.available) - Number(a.available));

    if (USBDevice) {
      devices.push(USBDevice);
    }
    if (ProxyDevice) {
      devices.push(ProxyDevice);
    }

    return devices;
  }, [knownDevices, scannedDevices, USBDevice, ProxyDevice]);

  const onAddNewPress = useCallback(() => {
    navigation.navigate(ScreenName.PairDevices, {
      onDone: () => {
        console.log("TODO, hook in the after pairing flow");
      },
    });
  }, [navigation]);

  const onBuyDevicePress = useCallback(() => {
    navigation.navigate(NavigatorName.BuyDevice, {
      screen: ScreenName.GetDevice,
    });
  }, [navigation]);

  return (
    <Flex mt={20}>
      <Flex flexDirection="row" justifyContent="space-between">
        <Text color="neutral.c60" uppercase>
          <Trans i18nKey="manager.selectDevice.saved" />
        </Text>
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
            <Item key={device.deviceId} device={device as Device} />
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

      <Flex alignItems="center">
        <Touchable onPress={onBuyDevicePress}>
          <Text color="primary.c90">
            <Trans i18nKey="manager.selectDevice.buyDeviceCTA" />
          </Text>
        </Touchable>
      </Flex>
    </Flex>
  );
}
