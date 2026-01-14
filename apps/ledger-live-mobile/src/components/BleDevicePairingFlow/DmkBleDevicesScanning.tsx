import React, { useMemo } from "react";
import {
  BleScanningState,
  filterScannedDevice,
  useBleDevicesScanning,
} from "@ledgerhq/live-dmk-mobile";
import {
  BleDevicesScanning,
  BleDevicesScanningProps,
} from "~/components/BleDevicePairingFlow/BleDevicesScanning";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { useSelector } from "~/context/hooks";
import { bleDevicesSelector } from "~/reducers/ble";
import { FilterByDeviceModelId } from "~/components/BleDevicePairingFlow/LegacyBleDevicesScanning";
import { useIsFocused } from "@react-navigation/core";

type DmkBleDevicesScanningProps = Omit<BleDevicesScanningProps, "devices"> & {
  /**
   * In some cases, the parent of this component handles the scanning logic, so we pass the scanning state there.
   */
  bleScanningState?: BleScanningState;
};

export const DmkBleDevicesScanning = (props: DmkBleDevicesScanningProps) => {
  const isFocused = useIsFocused();
  const filterByDeviceModelIds = useMemo(() => {
    if (Array.isArray(props.filterByDeviceModelId)) {
      return props.filterByDeviceModelId.filter(
        // This array should not contain `null` value, this is to make the type check pass
        (v: FilterByDeviceModelId): v is DeviceModelId => v !== null,
      );
    }
    return props.filterByDeviceModelId ? [props.filterByDeviceModelId] : undefined;
  }, [props.filterByDeviceModelId]);
  // If we want to filter on known devices:
  const knownDevices = useSelector(bleDevicesSelector);
  // .map creates a new array at each render and it was being used as a dependency on a useEffect
  // inside useBleDevicesScanning, so we need to memo it.
  const knownDeviceIds = useMemo(() => knownDevices.map(device => device.id), [knownDevices]);

  // if we directly use an empty array in the call of the hook, we get an infinite loop render
  // since at each render the array will have a new reference ([] !== [])
  const filterOutDevicesByDeviceIds = useMemo(
    () => (props.areKnownDevicesDisplayed ? [] : knownDeviceIds),
    [props.areKnownDevicesDisplayed, knownDeviceIds],
  );

  const bleScanningState = props.bleScanningState;

  const scanningEnabled = !bleScanningState && isFocused; // if the parent handles the scanning logic, we don't need to scan here

  const { scannedDevices: scannedDevicesFromHook } = useBleDevicesScanning(scanningEnabled);

  const scannedDevices = props.bleScanningState
    ? props.bleScanningState.scannedDevices
    : scannedDevicesFromHook;

  const filteredScannedDevices = useMemo(() => {
    return scannedDevices.filter(device =>
      filterScannedDevice(device, {
        filterOutDevicesByDeviceIds,
        filterByDeviceModelIds,
      }),
    );
  }, [scannedDevices, filterOutDevicesByDeviceIds, filterByDeviceModelIds]);

  return <BleDevicesScanning devices={filteredScannedDevices} {...props} />;
};
