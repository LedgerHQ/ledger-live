import React, { useMemo, useCallback } from "react";
import { Trans } from "react-i18next";
import { useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import { Text, Flex } from "@ledgerhq/native-ui";
import { useBleDevicesScanning } from "@ledgerhq/live-common/lib/ble/hooks/useBleDevicesScanning";

import TransportBLE from "../../react-native-hw-transport-ble";
import { NavigatorName, ScreenName } from "../../const";
import { knownDevicesSelector } from "../../reducers/ble";
import Touchable from "../Touchable";
import Item from "./Item";
import USBAndProxyItems from "./USBAndProxyItems";

type Props = {
  onSelect: (_: Device) => void;
};

export default function SelectDevice({ onSelect }: Props) {
  const knownDevices = useSelector(knownDevicesSelector);
  const navigation = useNavigation();
  const { scannedDevices } = useBleDevicesScanning({
    bleTransportListen: TransportBLE.listen,
  });

  const enhancedDeviceList = useMemo(
    () =>
      knownDevices
        .map(device => ({
          ...device,
          available: !!scannedDevices.find(
            ({ deviceId }) => device.id === deviceId,
          ),
          // TODO add rsi strength from the BIM pr.
        }))
        .sort((a, b) => Number(b.available) - Number(a.available)),
    [knownDevices, scannedDevices],
  );

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
        <Touchable onPress={onAddNewPress}>
          <Text color="primary.c90">
            <Trans i18nKey="manager.selectDevice.addNewCTA" />
          </Text>
        </Touchable>
      </Flex>

      <Flex my={4}>
        <USBAndProxyItems />
        {enhancedDeviceList.map(device => (
          <Item key={device.id} device={device} />
        ))}
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
