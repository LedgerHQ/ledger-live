import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollView } from "react-native";
import { Flex, InfiniteLoader, Text } from "@ledgerhq/native-ui";
import { BleErrorCode } from "react-native-ble-plx";
import { useBleDevicesScanning } from "@ledgerhq/live-common/ble/hooks/useBleDevicesScanning";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { getDeviceModel } from "@ledgerhq/devices";
import { Device, DeviceModelId } from "@ledgerhq/types-devices";
import TransportBLE from "@ledgerhq/react-native-hw-transport-ble";
import { TouchableOpacity } from "react-native-gesture-handler";
import { ArrowLeftMedium } from "@ledgerhq/native-ui/assets/icons";

import Animation from "../../components/Animation";
import { knownDevicesSelector } from "../../reducers/ble";
import LocationRequired from "../LocationRequired";
import BleDeviceItem from "./BleDeviceItem";
import type { BleDevicePairingFlowProps } from "./index";
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
  onDeviceSelect: (item: Device) => void;
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
  const knownDevices = useSelector(knownDevicesSelector);
  // .map creates a new array at each render and it was being used as a dependency on a useEffect
  // inside useBleDevicesScanning, so we need to memo it.
  const knownDeviceIds = useMemo(
    () => knownDevices.map(device => device.id),
    [knownDevices],
  );

  // if we directly use an empty array in the call of the hook, we get an infinite loop render
  // since at each render the array will have a new reference ([] !== [])
  const filterOutDevicesByDeviceIds = useMemo(
    () => (areKnownDevicesDisplayed ? [] : knownDeviceIds),
    [areKnownDevicesDisplayed, knownDeviceIds],
  );

  const { scannedDevices, scanningBleError } = useBleDevicesScanning({
    bleTransportListen: TransportBLE.listen,
    stopBleScanning,
    filterByDeviceModelIds: filterByDeviceModelId
      ? [filterByDeviceModelId]
      : undefined,
    filterOutDevicesByDeviceIds,
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
      </Flex>
      {scannedDevices.length > 0 ? (
        <Flex flex={1} px={4}>
          <ScrollView>
            <Flex pb={10}>
              {scannedDevices
                .map(item => ({
                  deviceId: item.deviceId,
                  deviceName: `${item.deviceName}`,
                  wired: false,
                  modelId: item.deviceModel.id,
                  isAlreadyKnown: Boolean(
                    knownDeviceIds.some(deviceId => deviceId === item.deviceId),
                  ),
                }))
                // unknown devices go first, already known devices go last
                .sort((a, b) =>
                  a.isAlreadyKnown === b.isAlreadyKnown
                    ? 0
                    : a.isAlreadyKnown
                    ? 1
                    : -1,
                )
                .map(deviceMeta => (
                  <BleDeviceItem
                    onSelect={() => onDeviceSelect(deviceMeta)}
                    key={deviceMeta.deviceId}
                    deviceMeta={deviceMeta}
                  />
                ))}
            </Flex>
          </ScrollView>
        </Flex>
      ) : (
        <InfiniteLoader />
      )}
    </Flex>
  );
};
