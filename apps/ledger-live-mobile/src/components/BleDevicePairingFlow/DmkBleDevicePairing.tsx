import React, { useEffect } from "react";
import { useBleDevicePairing } from "@ledgerhq/live-dmk";
import { Device } from "@ledgerhq/types-devices";
import { BleDevicePairingProgress } from "./BleDevicePairingContent/BleDevicePairingProgress";
import { getDeviceModel } from "@ledgerhq/devices";
import { BleDevicePaired } from "./BleDevicePairingContent/BleDevicePaired";

export const DmkBleDevicePairing = ({
  device,
  onRetry,
  onPaired,
}: {
  device: Device;
  onRetry: (device: Device) => void;
  onPaired: () => void;
}) => {
  const { isPaired, pairingError } = useBleDevicePairing({ device });
  const productName = getDeviceModel(device.modelId).productName || device.modelId;

  useEffect(() => {
    if (isPaired) {
      onPaired(device);
    }
  }, [isPaired, device, onPaired]);

  if (!isPaired) {
    return <BleDevicePairingProgress device={device} productName={productName} />;
  }
  return <BleDevicePaired device={device} productName={productName} />;
};
