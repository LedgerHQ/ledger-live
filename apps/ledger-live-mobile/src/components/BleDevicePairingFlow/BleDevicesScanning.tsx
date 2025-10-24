import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Linking, FlatList } from "react-native";
import { Flex, Text } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { getDeviceModel } from "@ledgerhq/devices";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { IconsLegacy } from "@ledgerhq/native-ui";
import { bleDevicesSelector } from "~/reducers/ble";
import Animation from "../Animation";
import BleDeviceItem from "./BleDeviceItem";
import Link from "~/components/wrappedUi/Link";
import lottie from "./assets/bluetooth.json";
import { urls } from "~/utils/urls";
import { TrackScreen, track } from "~/analytics";
import { ScannedDevice } from "@ledgerhq/live-dmk-mobile";

export type FilterByDeviceModelId = null | DeviceModelId;
const CANT_SEE_DEVICE_TIMEOUT = 5000;

export type BleDevicesScanningProps = {
  devices: ScannedDevice[];
  onDeviceSelect: (item: ScannedDevice) => void;
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

  const [listVersion, setListVersion] = useState(0);

  const knownDevices = useSelector(bleDevicesSelector);
  const knownDeviceIds = useMemo(() => knownDevices.map(d => d.id), [knownDevices]);
  const knownIdSet = useMemo(() => new Set(knownDeviceIds), [knownDeviceIds]);

  type TrackedDeviceState = {
    latestScannedSnapshot: ScannedDevice;
    isCurrentlyVisibleInScan: boolean;
    firstSeenSequenceNumber: number;
  };

  const trackedDeviceStateByIdRef = useRef<Map<string, TrackedDeviceState>>(new Map());
  const nextFirstSeenSequenceNumberRef = useRef<number>(0);
  const displayListVersion = listVersion;

  useEffect(() => {
    let didTrackedStateChange = false;

    const deviceIdsVisibleInThisScan = new Set<string>(
      devices.map(scannedDevice => scannedDevice.deviceId),
    );

    for (const scannedDevice of devices) {
      const existingTrackedState = trackedDeviceStateByIdRef.current.get(scannedDevice.deviceId);

      if (!existingTrackedState) {
        trackedDeviceStateByIdRef.current.set(scannedDevice.deviceId, {
          latestScannedSnapshot: scannedDevice,
          isCurrentlyVisibleInScan: true,
          firstSeenSequenceNumber: nextFirstSeenSequenceNumberRef.current++,
        });
        didTrackedStateChange = true;
        continue;
      }

      const didSnapshotReferenceChange =
        existingTrackedState.latestScannedSnapshot !== scannedDevice;

      if (didSnapshotReferenceChange || existingTrackedState.isCurrentlyVisibleInScan !== true) {
        trackedDeviceStateByIdRef.current.set(scannedDevice.deviceId, {
          latestScannedSnapshot: scannedDevice,
          isCurrentlyVisibleInScan: true,
          firstSeenSequenceNumber: existingTrackedState.firstSeenSequenceNumber,
        });
        didTrackedStateChange = true;
      }
    }

    for (const [deviceId, trackedState] of trackedDeviceStateByIdRef.current) {
      if (!deviceIdsVisibleInThisScan.has(deviceId) && trackedState.isCurrentlyVisibleInScan) {
        trackedDeviceStateByIdRef.current.set(deviceId, {
          ...trackedState,
          isCurrentlyVisibleInScan: false,
        });
        didTrackedStateChange = true;
      }
    }

    if (didTrackedStateChange) setListVersion(v => v + 1);
  }, [devices]);

  const displayedDevices = useMemo(() => {
    const enrichedDevices: Array<
      ScannedDevice & {
        isAlreadyKnown: boolean;
        grayedOut: boolean;
        discoveryStableOrder: number;
      }
    > = [];

    for (const [deviceId, trackedState] of trackedDeviceStateByIdRef.current) {
      const isAlreadyKnownForSorting = knownIdSet.has(deviceId) && !areKnownDevicesPairable;

      enrichedDevices.push({
        ...trackedState.latestScannedSnapshot,
        isAlreadyKnown: isAlreadyKnownForSorting,
        grayedOut: !trackedState.isCurrentlyVisibleInScan,
        discoveryStableOrder: trackedState.firstSeenSequenceNumber,
      });
    }

    enrichedDevices.sort((a, b) => {
      const knownGroupOrder = Number(a.isAlreadyKnown) - Number(b.isAlreadyKnown);
      if (knownGroupOrder !== 0) return knownGroupOrder;

      return a.discoveryStableOrder - b.discoveryStableOrder;
    });

    return enrichedDevices;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayListVersion, areKnownDevicesPairable, knownIdSet]);

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
          <Text
            color="neutral.c70"
            variant="body"
            fontWeight="medium"
            style={{ marginHorizontal: 24, textAlign: "center" }}
          >
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
                  modelId: item.modelId,
                  isAlreadyKnown: item.isAlreadyKnown,
                  grayedOut: item.grayedOut,
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
