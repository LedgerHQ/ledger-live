import React, { useEffect, useMemo } from "react";
import { Flex } from "@ledgerhq/native-ui";
import { useBleDevicePairing } from "@ledgerhq/live-dmk-mobile";
import { Device } from "@ledgerhq/types-devices";
import { getDeviceModel } from "@ledgerhq/devices";
import { BleFailedPairing } from "~/components/BleDevicePairingFlow/BleDevicePairingContent/BleFailedPairing";
import { BleDevicePairingProgress } from "./BleDevicePairingContent/BleDevicePairingProgress";
import { BleDevicePaired } from "./BleDevicePairingContent/BleDevicePaired";
import { BleForgetDeviceDrawer } from "./BleDevicePairingContent/BleForgetDeviceDrawer";
import { areRealBleAndUsbDisabled } from "~/transport/areRealBleAndUsbDisabled";

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
  const { isPaired, pairingError } = useBleDevicePairing({
    enabled: !areRealBleAndUsbDisabled(),
    device,
  });

  const productName = getDeviceModel(device.modelId).productName || device.modelId;
  let content;

  const needsToForgetDevice = useMemo(() => {
    return (pairingError as { name?: string })?.name === "PeerRemovedPairing";
  }, [pairingError]);

  useEffect(() => {
    if (isPaired) {
      onPaired(device);
    }
  }, [isPaired, device, onPaired]);

  const pairingErrorName = (pairingError as { name?: string })?.name;
  if (isPaired) {
    content = <BleDevicePaired device={device} productName={productName} />;
  } else if (pairingErrorName === "PeerRemovedPairing") {
    content = (
      <BleForgetDeviceDrawer
        isOpen={needsToForgetDevice}
        productName={productName}
        onRetry={onRetry}
      />
    );
  } else if (pairingError && pairingErrorName !== "LockedDeviceError") {
    content = (
      <BleFailedPairing productName={productName} onRetry={onRetry} onOpenHelp={onOpenHelp} />
    );
  } else {
    content = <BleDevicePairingProgress device={device} productName={productName} />;
  }

  return <Flex flex={1}>{content}</Flex>;
};
