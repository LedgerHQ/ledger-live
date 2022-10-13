import React, { useCallback, useEffect, useState } from "react";
import { FlatList } from "react-native";
import { Flex, InfiniteLoader, Text } from "@ledgerhq/native-ui";
import { BleErrorCode } from "react-native-ble-plx";
import { useBleDevicesScanning } from "@ledgerhq/live-common/ble/hooks/useBleDevicesScanning";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { ScannedDevice } from "@ledgerhq/live-common/ble/types";
import { getDeviceModel } from "@ledgerhq/devices";
import { DeviceModelId } from "@ledgerhq/types-devices";
import TransportBLE from "@ledgerhq/react-native-hw-transport-ble";
import { TouchableOpacity } from "react-native-gesture-handler";
import { ArrowLeftMedium } from "@ledgerhq/native-ui/assets/icons";

import { knownDevicesSelector } from "../../reducers/ble";
import LocationRequired from "../LocationRequired";
import BleDeviceItem from "./BleDeviceItem";
import type { BleDevicePairingFlowProps } from "./index";
import Animation from "../../components/Animation";
import lottie from "./assets/bluetooth.json";

const HeaderLeft = ({ onClose }: { onClose: () => void }) => {
  return (
    <Flex pt={8} px={6}>
      <TouchableOpacity onPress={onClose}>
        <ArrowLeftMedium size={24} />
      </TouchableOpacity>
    </Flex>
  );
};

export type FilterByDeviceModelId = null | DeviceModelId;

export type BleDevicesScanningProps = {
  onDeviceSelect: (item: ScannedDevice) => void;
  filterByDeviceModelId?: FilterByDeviceModelId;
  areKnownDevicesDisplayed?: boolean;
};

export const BleDevicesScanning = ({
  onDeviceSelect,
  filterByDeviceModelId = null,
  areKnownDevicesDisplayed,
}: BleDevicesScanningProps) => {
  const { t } = useTranslation();
  const navigation = useNavigation<BleDevicePairingFlowProps["navigation"]>();

  useEffect(() => {
    navigation.setOptions({
      headerRight: undefined,
      headerLeft: () => <HeaderLeft onClose={navigation.goBack} />,
    });
  }, [navigation]);

  const productName = filterByDeviceModelId
    ? getDeviceModel(filterByDeviceModelId).productName || filterByDeviceModelId
    : null;

  const [locationDisabledError, setLocationDisabledError] =
    useState<boolean>(false);
  const [locationUnauthorizedError, setLocationUnauthorizedError] =
    useState<boolean>(false);
  const [stopBleScanning, setStopBleScanning] = useState<boolean>(false);

  // If we want to filter on known devices:
  const knownDeviceIds = useSelector(knownDevicesSelector).map(
    device => device.id,
  );

  const { scannedDevices, scanningBleError } = useBleDevicesScanning({
    bleTransportListen: TransportBLE.listen,
    stopBleScanning,
    filterByDeviceModelIds: filterByDeviceModelId
      ? [filterByDeviceModelId]
      : undefined,
    filterOutDevicesByDeviceIds: areKnownDevicesDisplayed ? [] : knownDeviceIds,
  });

  // Handles scanning error
  useEffect(() => {
    if (scanningBleError) {
      // Currently using the error code values from react-native-ble-plx
      // It should be defined indenpendently, in live-common
      if (
        scanningBleError?.errorCode === BleErrorCode.LocationServicesDisabled
      ) {
        setStopBleScanning(true);
        setLocationDisabledError(true);
      }

      if (scanningBleError?.errorCode === BleErrorCode.BluetoothUnauthorized) {
        setStopBleScanning(true);
        setLocationUnauthorizedError(true);
      }
    }
  }, [scanningBleError]);

  const renderItem = useCallback(
    ({ item }: { item: ScannedDevice }) => {
      const isAlreadyKnown = !!(
        areKnownDevicesDisplayed &&
        knownDeviceIds.some(deviceId => deviceId === item.deviceId)
      );

      const deviceMeta = {
        deviceId: item.deviceId,
        deviceName: `${item.deviceName}`,
        wired: false,
        modelId: item.deviceModel.id,
        isAlreadyKnown,
      };

      return (
        <BleDeviceItem
          deviceMeta={deviceMeta}
          onSelect={() => onDeviceSelect(item)}
        />
      );
    },
    [areKnownDevicesDisplayed, knownDeviceIds, onDeviceSelect],
  );

  const onLocationFixed = useCallback(() => {
    setLocationDisabledError(false);
    setLocationUnauthorizedError(false);
    setStopBleScanning(false);
  }, [setLocationDisabledError, setLocationUnauthorizedError]);

  if (locationDisabledError) {
    return <LocationRequired onRetry={onLocationFixed} errorType="disabled" />;
  }

  if (locationUnauthorizedError) {
    return (
      <LocationRequired onRetry={onLocationFixed} errorType="unauthorized" />
    );
  }

  return (
    <Flex bg="background.main" height="100%">
      <Flex px={4}>
        <Flex height={180} alignItems="center" justifyContent="center">
          <Animation source={lottie} />
        </Flex>
        <Text mb={3} textAlign="center" variant="h4" fontWeight="semiBold">
          {productName
            ? t("blePairingFlow.scanning.withProductName.title", {
                productName,
              })
            : t("blePairingFlow.scanning.withoutProductName.title")}
        </Text>
        <Text
          mb={8}
          color="neutral.c70"
          textAlign="center"
          variant="body"
          fontWeight="medium"
        >
          {productName
            ? t("blePairingFlow.scanning.withProductName.description", {
                productName,
              })
            : t("blePairingFlow.scanning.withoutProductName.description")}
        </Text>
        <FlatList
          data={scannedDevices}
          renderItem={renderItem}
          keyExtractor={item => `${item.deviceId}`}
          ListEmptyComponent={<InfiniteLoader size={58} />}
        />
      </Flex>
    </Flex>
  );
};
