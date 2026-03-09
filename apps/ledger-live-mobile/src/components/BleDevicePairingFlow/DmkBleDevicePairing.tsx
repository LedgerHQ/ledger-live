import React, { useEffect, useMemo } from "react";
import Config from "react-native-config";
import { Flex } from "@ledgerhq/native-ui";
import { useBleDevicePairing } from "@ledgerhq/live-dmk-mobile";
import { Device } from "@ledgerhq/types-devices";
import { getDeviceModel } from "@ledgerhq/devices";
import { LockedDeviceError, PeerRemovedPairing } from "@ledgerhq/errors";
import { BleFailedPairing } from "~/components/BleDevicePairingFlow/BleDevicePairingContent/BleFailedPairing";
import { BleDevicePairingProgress } from "./BleDevicePairingContent/BleDevicePairingProgress";
import { BleDevicePaired } from "./BleDevicePairingContent/BleDevicePaired";
import { BleForgetDeviceDrawer } from "./BleDevicePairingContent/BleForgetDeviceDrawer";
import { useMockBleDevicePairing } from "~/transport/bleTransport/useMockBle";

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
  // FIXME: this will be done properly by injecting the mock transport directly in the DMK transport builder
  const isMockMode = Boolean(Config.MOCK || Config.DETOX);

  // Use mock pairing in e2e test mode, real DMK pairing otherwise
  const mockPairingResult = useMockBleDevicePairing({ enabled: isMockMode, device });
  const realPairingResult = useBleDevicePairing({ enabled: !isMockMode, device });

  const { isPaired, pairingError } = isMockMode ? mockPairingResult : realPairingResult;

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
