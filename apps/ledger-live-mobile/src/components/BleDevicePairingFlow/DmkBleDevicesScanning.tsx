import React, { useMemo } from "react";
import { useBleDevicesScanning } from "@ledgerhq/live-dmk-mobile";
import {
  BleDevicesScanning,
  BleDevicesScanningProps,
} from "~/components/BleDevicePairingFlow/BleDevicesScanning";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { useSelector } from "react-redux";
import { bleDevicesSelector } from "~/reducers/ble";
import { FilterByDeviceModelId } from "~/components/BleDevicePairingFlow/LegacyBleDevicesScanning";

type DmkBleDevicesScanningProps = Omit<BleDevicesScanningProps, "devices">;

export const DmkBleDevicesScanning = (scanningProps: DmkBleDevicesScanningProps) => {
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
    filterOutDevicesByDeviceIds,
    filterByDeviceModelIds,
  });

  return <BleDevicesScanning devices={scannedDevices} {...scanningProps} />;
};
