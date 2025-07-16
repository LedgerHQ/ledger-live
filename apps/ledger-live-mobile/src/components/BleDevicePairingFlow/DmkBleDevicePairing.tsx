import React, { useEffect } from "react";
import { useBleDevicePairing } from "@ledgerhq/live-dmk-mobile";
import { Device } from "@ledgerhq/types-devices";
import { BleDevicePairingProgress } from "./BleDevicePairingContent/BleDevicePairingProgress";
import { getDeviceModel } from "@ledgerhq/devices";
import { BleDevicePaired } from "./BleDevicePairingContent/BleDevicePaired";
import { LockedDeviceError, PeerRemovedPairing } from "@ledgerhq/errors";
import { BleDevicePeerRemoved } from "~/components/BleDevicePairingFlow/BleDevicePairingContent/BleDevicePeerRemoved";
import { BleFailedPairing } from "~/components/BleDevicePairingFlow/BleDevicePairingContent/BleFailedPairing";
import { Flex } from "@ledgerhq/native-ui";

export const DmkBleDevicePairing = ({
  device,
  onRetry,
  onPaired,
  onOpenHelp,
}: {
  device: Device;
  onRetry: () => void;
  onPaired: (device: Device) => void;
  onOpenHelp: () => void;
}) => {
  const { isPaired, pairingError } = useBleDevicePairing({ device });
  const productName = getDeviceModel(device.modelId).productName || device.modelId;
  let content = null;

  if (isPaired) {
    content = <BleDevicePaired device={device} productName={productName} />;
  } else if (pairingError instanceof PeerRemovedPairing) {
    content = (
      // TODO: fix this
      // @ts-expect-error DmkError is missing name and some other properties
      <BleDevicePeerRemoved onRetry={onRetry} onOpenHelp={onOpenHelp} pairingError={pairingError} />
    );
  } else if (pairingError && !((pairingError as unknown) instanceof LockedDeviceError)) {
    // TODO refactor this into the generic error rendering when possible.
    content = (
      <BleFailedPairing onRetry={onRetry} onOpenHelp={onOpenHelp} productName={productName} />
    );
  } else {
    content = <BleDevicePairingProgress device={device} productName={productName} />;
  }

  useEffect(() => {
    if (isPaired) {
      onPaired(device);
    }
  }, [isPaired, device, onPaired]);

  return (
    <Flex flex={1} width="100%">
      {content}

      {/*{deviceLocked ? (*/}
      {/*  <UnlockDeviceDrawer isOpen={true} device={deviceLocked} onClose={onRetry} />*/}
      {/*) : null}*/}
    </Flex>
  );
};
