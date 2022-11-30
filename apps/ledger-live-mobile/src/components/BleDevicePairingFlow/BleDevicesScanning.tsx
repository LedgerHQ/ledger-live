import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollView } from "react-native";
import {
  Flex,
  InfiniteLoader,
  ScrollListContainer,
  Text,
} from "@ledgerhq/native-ui";
import { useBleDevicesScanning } from "@ledgerhq/live-common/ble/hooks/useBleDevicesScanning";
import { HwTransportErrorType } from "@ledgerhq/errors";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { getDeviceModel } from "@ledgerhq/devices";
import { Device, DeviceModelId } from "@ledgerhq/types-devices";
import TransportBLE from "../../react-native-hw-transport-ble";
import { knownDevicesSelector } from "../../reducers/ble";
import LocationRequired from "../LocationRequired/index";
import Animation from "../Animation";
import DeviceSetupView from "../DeviceSetupView";
import BleDeviceItem from "./BleDeviceItem";
import lottie from "./assets/bluetooth.json";

export type FilterByDeviceModelId = null | DeviceModelId;

export type BleDevicesScanningProps = {
  onDeviceSelect: (item: Device) => void;
  onGoBack?: () => void;
  filterByDeviceModelId?: FilterByDeviceModelId;
  areKnownDevicesDisplayed?: boolean;
};

/**
 * Runs a BLE scan and list seen devices
 *
 * @param onDeviceSelect Function called when the user selects a scanned device
 * @param filterByDeviceModelId The only model of the devices that will be scanned
 * @param areKnownDevicesDisplayed Choose to display seen devices that are already known by LLM
 * @param onGoBack If this function is set, a back arrow is displayed that calls this function if pressed
 */
const BleDevicesScanning = ({
  onDeviceSelect,
  filterByDeviceModelId = null,
  areKnownDevicesDisplayed,
  onGoBack,
}: BleDevicesScanningProps) => {
  const { t } = useTranslation();

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

  const filterByDeviceModelIds = useMemo(
    () => (filterByDeviceModelId ? [filterByDeviceModelId] : undefined),
    [filterByDeviceModelId],
  );

  const { scannedDevices, scanningBleError } = useBleDevicesScanning({
    bleTransportListen: TransportBLE.listen,
    stopBleScanning,
    filterByDeviceModelIds,
    filterOutDevicesByDeviceIds,
  });

  // Handles scanning error
  useEffect(() => {
    if (scanningBleError) {
      if (
        scanningBleError.type ===
        HwTransportErrorType.BleLocationServicesDisabled
      ) {
        setStopBleScanning(true);
        setLocationDisabledError(true);
      }

      if (
        scanningBleError.type === HwTransportErrorType.BleBluetoothUnauthorized
      ) {
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
    <DeviceSetupView onBack={onGoBack}>
      <ScrollListContainer display="flex" flex={1} px={4}>
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
                      knownDeviceIds.some(
                        deviceId => deviceId === item.deviceId,
                      ),
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
      </ScrollListContainer>
    </DeviceSetupView>
  );
};

export default BleDevicesScanning;
