import React from "react";
import { Device } from "@ledgerhq/types-devices";
import { FlatList } from "react-native";
import BleDeviceItem from "~/components/BleDevicePairingFlow/BleDeviceItem";
import { deviceIdMap, useBleDevicesScanning } from "@ledgerhq/live-dmk-mobile";
import { DeviceModelId } from "@ledgerhq/devices";

export type DmkBleDevicesScanningProps = {
  onDeviceSelect: (item: Device) => void;
};

export const DmkBleDevicesScanning = ({ onDeviceSelect }: DmkBleDevicesScanningProps) => {
  const { scannedDevices, scanningBleError } = useBleDevicesScanning({
    mapper: device => ({
      deviceId: device.id,
      deviceName: `${device.name}`,
      wired: false,
      modelId: `${deviceIdMap[device.deviceModel.model]}`,
      isAlreadyKnown: false,
    }),
  });

  return (
    <FlatList
      data={scannedDevices}
      keyExtractor={item => item.deviceId}
      renderItem={({ item }) => (
        <BleDeviceItem
          onSelect={() => onDeviceSelect(item)}
          deviceMeta={{
            deviceId: item.deviceId,
            deviceName: item.deviceName,
            wired: false,
            modelId: item.modelId as DeviceModelId,
            isAlreadyKnown: false,
          }}
          areKnownDevicesPairable={false}
        />
      )}
    />
  );
};
