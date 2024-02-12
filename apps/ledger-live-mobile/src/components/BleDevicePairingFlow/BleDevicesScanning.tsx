import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollView, Linking } from "react-native";
import { Flex, Text } from "@ledgerhq/native-ui";
import { useBleDevicesScanning } from "@ledgerhq/live-common/ble/hooks/useBleDevicesScanning";
import { HwTransportErrorType } from "@ledgerhq/errors";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { getDeviceModel } from "@ledgerhq/devices";
import { Device, DeviceModelId } from "@ledgerhq/types-devices";
import { useNavigation } from "@react-navigation/native";
import { IconsLegacy } from "@ledgerhq/native-ui";
import TransportBLE from "../../react-native-hw-transport-ble";
import { knownDevicesSelector } from "~/reducers/ble";
import Animation from "../Animation";
import BleDeviceItem from "./BleDeviceItem";
import Link from "~/components/wrappedUi/Link";
import lottie from "./assets/bluetooth.json";
import { urls } from "~/utils/urls";
import { TrackScreen, track } from "~/analytics";
import { useResetOnNavigationFocusState } from "~/helpers/useResetOnNavigationFocusState";
import LocationPermissionDenied from "../RequiresLocation/LocationPermissionDenied";
import LocationDisabled from "../RequiresLocation/LocationDisabled";

export type FilterByDeviceModelId = null | DeviceModelId;
const CANT_SEE_DEVICE_TIMEOUT = 5000;

export type BleDevicesScanningProps = {
  onDeviceSelect: (item: Device) => void;
  filterByDeviceModelId?: FilterByDeviceModelId;
  areKnownDevicesDisplayed?: boolean;
  areKnownDevicesPairable?: boolean;
};

/**
 * Runs a BLE scan and list seen devices
 *
 * This components should be wrapped in a RequiresBLE component.
 * This is the case in the BleDevicePairingFlow component.
 * If this is not the case, some BLE and locations errors are handled, but not as well as with RequiresBLE.
 *
 * @param onDeviceSelect Function called when the user selects a scanned device
 * @param filterByDeviceModelId The only model of the devices that will be scanned
 * @param areKnownDevicesDisplayed Choose to display seen devices that are already known by LLM
 * @param areKnownDevicesPairable Display already known devices in the same way as unknown devices, allowing to connect to them.
 */
const BleDevicesScanning = ({
  onDeviceSelect,
  filterByDeviceModelId = null,
  areKnownDevicesDisplayed,
  areKnownDevicesPairable,
}: BleDevicesScanningProps) => {
  const { t } = useTranslation();
  const navigation = useNavigation();

  const productName = filterByDeviceModelId
    ? getDeviceModel(filterByDeviceModelId).productName || filterByDeviceModelId
    : null;

  const [locationDisabledError, setLocationDisabledError] = useState<boolean>(false);
  const [locationUnauthorizedError, setLocationUnauthorizedError] = useState<boolean>(false);

  // Nb Will reset when we regain focus to start scanning again.
  const [stopBleScanning, setStopBleScanning] = useResetOnNavigationFocusState(navigation, false);

  const [isCantSeeDeviceShown, setIsCantSeeDeviceShown] = useState<boolean>(false);
  useEffect(() => {
    const cantSeeDeviceTimeout = setTimeout(
      () => setIsCantSeeDeviceShown(true),
      CANT_SEE_DEVICE_TIMEOUT,
    );

    return () => clearTimeout(cantSeeDeviceTimeout);
  }, []);

  const onWrappedDeviceSelect = useCallback(
    (device: Device) => {
      setStopBleScanning(true);
      onDeviceSelect(device);
    },
    [onDeviceSelect, setStopBleScanning],
  );

  const onCantSeeDevicePress = useCallback(() => {
    track("button_clicked", {
      button: "Can’t find device Bluetooth",
    });
    Linking.openURL(urls.pairingIssues);
  }, []);

  // If we want to filter on known devices:
  const knownDevices = useSelector(knownDevicesSelector);
  // .map creates a new array at each render and it was being used as a dependency on a useEffect
  // inside useBleDevicesScanning, so we need to memo it.
  const knownDeviceIds = useMemo(() => knownDevices.map(device => device.id), [knownDevices]);

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

  // Handles some scanning errors.
  // Only location disabled and BLE unauthorized errors are handled here.
  // This components should be wrapped in a RequiresBLE component.
  // If this is the case, such errors should not happen.
  useEffect(() => {
    if (scanningBleError) {
      // Location disabled
      if (scanningBleError.type === HwTransportErrorType.LocationServicesDisabled) {
        setStopBleScanning(true);
        setLocationDisabledError(true);
      }

      // Location unauthorized
      if (scanningBleError.type === HwTransportErrorType.LocationServicesUnauthorized) {
        setStopBleScanning(true);
        setLocationUnauthorizedError(true);
      }
    } else {
      setLocationDisabledError(false);
      setLocationUnauthorizedError(false);
    }
  }, [scanningBleError, setStopBleScanning]);

  // This error should never happen if this component is wrapped in a RequiresBLE component.
  if (locationDisabledError) {
    return <LocationDisabled />;
  }

  // This error should never happen if this component is wrapped in a RequiresBLE component.
  if (locationUnauthorizedError) {
    return <LocationPermissionDenied />;
  }

  return (
    <Flex flex={1}>
      <TrackScreen category={"Looking for device Bluetooth"} />
      <Flex flex={1} px={2}>
        <Flex py={16}>
          <Flex height={100} alignItems="center" justifyContent="center" mb={24}>
            <Animation style={{ width: 250 }} source={lottie} />
          </Flex>
          <Text mb={3} textAlign="center" variant="h4" fontWeight="semiBold" fontSize={24}>
            {productName
              ? t("blePairingFlow.scanning.withProductName.title", {
                  productName,
                })
              : t("blePairingFlow.scanning.withoutProductName.title")}
          </Text>
          <Text color="neutral.c70" textAlign="center" variant="body" fontWeight="medium">
            {t("blePairingFlow.scanning.description")}
          </Text>
        </Flex>

        <Flex flex={1} py={16}>
          <ScrollView>
            <Flex pb={10}>
              {scannedDevices
                .map(item => ({
                  deviceId: item.deviceId,
                  deviceName: `${item.deviceName}`,
                  wired: false,
                  modelId: item.deviceModel.id,
                  isAlreadyKnown:
                    !areKnownDevicesPairable &&
                    Boolean(knownDeviceIds.some(deviceId => deviceId === item.deviceId)),
                }))
                // unknown devices go first, already known devices go last
                .sort((a, b) =>
                  a.isAlreadyKnown === b.isAlreadyKnown ? 0 : a.isAlreadyKnown ? 1 : -1,
                )
                .map(deviceMeta => (
                  <BleDeviceItem
                    onSelect={() => onWrappedDeviceSelect(deviceMeta)}
                    key={deviceMeta.deviceId}
                    deviceMeta={deviceMeta}
                    areKnownDevicesPairable={areKnownDevicesPairable}
                  />
                ))}
            </Flex>
          </ScrollView>
        </Flex>
      </Flex>
      {productName !== null && isCantSeeDeviceShown && (
        <Flex pb={16}>
          <Link
            onPress={onCantSeeDevicePress}
            size={"medium"}
            Icon={IconsLegacy.HelpMedium}
            type="shade"
            iconPosition="right"
          >
            {t("blePairingFlow.scanning.cantSeeDevice", { productName })}
          </Link>
        </Flex>
      )}
    </Flex>
  );
};

export default BleDevicesScanning;
