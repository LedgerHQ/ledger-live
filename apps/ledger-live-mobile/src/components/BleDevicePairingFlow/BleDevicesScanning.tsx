import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Linking, FlatList } from "react-native";
import { Flex, Text } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { getDeviceModel } from "@ledgerhq/devices";
import { Device, DeviceModelId } from "@ledgerhq/types-devices";
import { IconsLegacy } from "@ledgerhq/native-ui";
import { bleDevicesSelector } from "~/reducers/ble";
import Animation from "../Animation";
import BleDeviceItem from "./BleDeviceItem";
import Link from "~/components/wrappedUi/Link";
import lottie from "./assets/bluetooth.json";
import { urls } from "~/utils/urls";
import { TrackScreen, track } from "~/analytics";

export type FilterByDeviceModelId = null | DeviceModelId;
const CANT_SEE_DEVICE_TIMEOUT = 5000;

export type BleDevicesScanningProps = {
  devices: Device[];
  onDeviceSelect: (item: Device) => void;
  filterByDeviceModelId?: FilterByDeviceModelId | FilterByDeviceModelId[];
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
export const BleDevicesScanning: React.FC<BleDevicesScanningProps> = ({
  devices,
  onDeviceSelect,
  filterByDeviceModelId = null,
  areKnownDevicesPairable,
}: BleDevicesScanningProps) => {
  const { t } = useTranslation();

  const productName =
    filterByDeviceModelId && !Array.isArray(filterByDeviceModelId)
      ? getDeviceModel(filterByDeviceModelId).productName || filterByDeviceModelId
      : null;

  const [isCantSeeDeviceShown, setIsCantSeeDeviceShown] = useState<boolean>(false);
  useEffect(() => {
    const cantSeeDeviceTimeout = setTimeout(
      () => setIsCantSeeDeviceShown(true),
      CANT_SEE_DEVICE_TIMEOUT,
    );

    return () => clearTimeout(cantSeeDeviceTimeout);
  }, []);

  const onCantSeeDevicePress = useCallback(() => {
    track("button_clicked", {
      button: "Can’t find device Bluetooth",
    });
    Linking.openURL(urls.pairingIssues);
  }, []);

  // If we want to filter on known devices:
  const knownDevices = useSelector(bleDevicesSelector);
  // .map creates a new array at each render and it was being used as a dependency on a useEffect
  // inside useBleDevicesScanning, so we need to memo it.
  const knownDeviceIds = useMemo(() => knownDevices.map(device => device.id), [knownDevices]);
  const displayedDevices = useMemo(
    () =>
      devices
        .map(item => ({
          ...item,
          isAlreadyKnown:
            !areKnownDevicesPairable &&
            Boolean(knownDeviceIds.some(deviceId => deviceId === item.deviceId)),
        }))
        // unknown devices go first, already known devices go last
        .sort((a, b) => (a.isAlreadyKnown === b.isAlreadyKnown ? 0 : a.isAlreadyKnown ? 1 : -1)),
    [areKnownDevicesPairable, devices, knownDeviceIds],
  );

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
          <FlatList
            data={displayedDevices}
            contentContainerStyle={{ paddingBottom: 10 }}
            extraData={{ knownDeviceIds }}
            keyExtractor={item => item.deviceId}
            renderItem={({ item }) => (
              <BleDeviceItem
                onSelect={() => onDeviceSelect(item)}
                deviceMeta={{
                  deviceId: item.deviceId,
                  deviceName: item.deviceName,
                  wired: false,
                  modelId: item.modelId as DeviceModelId,
                  isAlreadyKnown: item.isAlreadyKnown,
                }}
                areKnownDevicesPairable={false}
              />
            )}
          />
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
