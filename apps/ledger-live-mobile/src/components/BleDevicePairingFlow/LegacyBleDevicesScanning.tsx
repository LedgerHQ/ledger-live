import React, { useMemo } from "react";
import { useBleDevicesScanning } from "@ledgerhq/live-common/ble/hooks/useBleDevicesScanning";
import { useSelector } from "react-redux";
import { DeviceModelId } from "@ledgerhq/types-devices";
import getBLETransport from "../../react-native-hw-transport-ble";
import { bleDevicesSelector } from "~/reducers/ble";
import {
  BleDevicesScanning,
  BleDevicesScanningProps,
} from "~/components/BleDevicePairingFlow/BleDevicesScanning";

export type FilterByDeviceModelId = null | DeviceModelId;

type LegacyBleDevicesScanningProps = Omit<BleDevicesScanningProps, "devices">;

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
export function LegacyBleDevicesScanning(scanningProps: LegacyBleDevicesScanningProps) {
  const filterByDeviceModelIds = useMemo(() => {
    if (Array.isArray(scanningProps.filterByDeviceModelId)) {
      return scanningProps.filterByDeviceModelId.filter(
        // This array should not contain `null` value, this is to make the type check pass
        (v: FilterByDeviceModelId): v is DeviceModelId => v !== null,
      );
    }
    return scanningProps.filterByDeviceModelId ? [scanningProps.filterByDeviceModelId] : undefined;
  }, [scanningProps.filterByDeviceModelId]);
  // If we want to filter on known devices:
  const knownDevices = useSelector(bleDevicesSelector);
  // .map creates a new array at each render and it was being used as a dependency on a useEffect
  // inside useBleDevicesScanning, so we need to memo it.
  const knownDeviceIds = useMemo(() => knownDevices.map(device => device.id), [knownDevices]);

  // if we directly use an empty array in the call of the hook, we get an infinite loop render
  // since at each render the array will have a new reference ([] !== [])
  const filterOutDevicesByDeviceIds = useMemo(
    () => (scanningProps.areKnownDevicesDisplayed ? [] : knownDeviceIds),
    [scanningProps.areKnownDevicesDisplayed, knownDeviceIds],
  );

  const { scannedDevices } = useBleDevicesScanning({
    bleTransportListen: getBLETransport({ isLDMKEnabled: false }).listen,
    stopBleScanning: false,
    filterByDeviceModelIds,
    filterOutDevicesByDeviceIds,
  });
  const displayedDevices = useMemo(
    () =>
      scannedDevices
        .map(item => ({
          deviceId: item.deviceId,
          deviceName: `${item.deviceName}`,
          wired: false,
          modelId: item.deviceModel.id,
          isAlreadyKnown:
            !scanningProps.areKnownDevicesPairable &&
            Boolean(knownDeviceIds.some(deviceId => deviceId === item.deviceId)),
        }))
        // unknown devices go first, already known devices go last
        .sort((a, b) => (a.isAlreadyKnown === b.isAlreadyKnown ? 0 : a.isAlreadyKnown ? 1 : -1)),
    [scanningProps.areKnownDevicesPairable, knownDeviceIds, scannedDevices],
  );

  return <BleDevicesScanning devices={displayedDevices} {...scanningProps} />;
}
