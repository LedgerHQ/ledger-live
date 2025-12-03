import React, { useEffect, useMemo } from "react";
import { Flex } from "@ledgerhq/native-ui";
import { useBleDevicePairing } from "@ledgerhq/live-dmk-mobile";
import { Device } from "@ledgerhq/types-devices";
import { getDeviceModel } from "@ledgerhq/devices";
import { LockedDeviceError, PeerRemovedPairing } from "@ledgerhq/errors";
import { BleFailedPairing } from "~/components/BleDevicePairingFlow/BleDevicePairingContent/BleFailedPairing";
import { BleDevicePairingProgress } from "./BleDevicePairingContent/BleDevicePairingProgress";
import { BleDevicePaired } from "./BleDevicePairingContent/BleDevicePaired";
import { BleForgetDeviceDrawer } from "./BleDevicePairingContent/BleForgetDeviceDrawer";

type DmkBleDevicePairingProps = {
  device: Device;
  onPaired: (device: Device) => void;
  onRetry: () => void;
  onOpenHelp: () => void;
};

export const DmkBleDevicePairing = ({
  device,
  onRetry,
  onPaired,
  onOpenHelp,
}: DmkBleDevicePairingProps) => {
  const { isPaired, pairingError } = useBleDevicePairing({ device });
  const productName = getDeviceModel(device.modelId).productName || device.modelId;
  let content;

  const needsToForgetDevice = useMemo(() => {
    return pairingError instanceof PeerRemovedPairing;
  }, [pairingError]);

  useEffect(() => {
    if (isPaired) {
      onPaired(device);
    }
  }, [isPaired, device, onPaired]);

  if (isPaired) {
    content = <BleDevicePaired device={device} productName={productName} />;
  } else if (pairingError instanceof PeerRemovedPairing) {
    content = (
      <BleForgetDeviceDrawer
        isOpen={needsToForgetDevice}
        productName={productName}
        onRetry={onRetry}
      />
    );
  } else if (pairingError && !(pairingError instanceof LockedDeviceError)) {
    content = (
      <BleFailedPairing productName={productName} onRetry={onRetry} onOpenHelp={onOpenHelp} />
    );
  } else {
    content = <BleDevicePairingProgress device={device} productName={productName} />;
  }

  return <Flex flex={1}>{content}</Flex>;
};
