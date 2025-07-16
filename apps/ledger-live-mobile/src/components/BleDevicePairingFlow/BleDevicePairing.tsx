import React, { ReactNode, useEffect, useState } from "react";
import { useBleDevicePairing } from "@ledgerhq/live-common/ble/hooks/useBleDevicePairing";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { getDeviceModel } from "@ledgerhq/devices";
import { Flex } from "@ledgerhq/native-ui";

import { LockedDeviceError, PeerRemovedPairing } from "@ledgerhq/errors";
import UnlockDeviceDrawer from "../UnlockDeviceDrawer";
import { BleDevicePaired } from "./BleDevicePairingContent/BleDevicePaired";
import { BleDevicePeerRemoved } from "./BleDevicePairingContent/BleDevicePeerRemoved";
import { BleFailedPairing } from "./BleDevicePairingContent/BleFailedPairing";
import { BleDevicePairingProgress } from "./BleDevicePairingContent/BleDevicePairingProgress";

export type BleDevicePairingProps = {
  onPaired: (device: Device) => void;
  onRetry: () => void;
  onOpenHelp: () => void;
  deviceToPair: Device;
};

/**
 * Runs a BLE pairing with the given device. Displays pairing, success or error steps.
 *
 * A closing cross is displayed to the user during the pairing, which either calls onPaired if
 * the device is already paired, or onRetry otherwise.
 *
 * @param deviceToPair Device to pair
 * @param onPaired Function called when pairing was successful
 * @param onRetry Function called when the user chooses to retry on unsuccessful pairing
 */
const BleDevicePairing = ({
  deviceToPair,
  onPaired,
  onRetry,
  onOpenHelp,
}: BleDevicePairingProps) => {
  const [deviceLocked, setDeviceLocked] = useState<Device | null>(null);

  const productName = getDeviceModel(deviceToPair.modelId).productName || deviceToPair.modelId;

  const { isPaired, pairingError } = useBleDevicePairing({
    deviceId: deviceToPair.deviceId,
  });

  useEffect(() => {
    if (pairingError instanceof LockedDeviceError) {
      setDeviceLocked(deviceToPair);
      return;
    }

    setDeviceLocked(null);
  }, [deviceToPair, pairingError]);

  useEffect(() => {
    if (isPaired) {
      onPaired(deviceToPair);
    }
  }, [isPaired, deviceToPair, onPaired]);

  let content: ReactNode;

  if (isPaired) {
    content = <BleDevicePaired device={deviceToPair} productName={productName} />;
  } else if (pairingError instanceof PeerRemovedPairing) {
    content = (
      <BleDevicePeerRemoved onRetry={onRetry} onOpenHelp={onOpenHelp} pairingError={pairingError} />
    );
  } else if (pairingError && !((pairingError as unknown) instanceof LockedDeviceError)) {
    // TODO refactor this into the generic error rendering when possible.
    content = (
      <BleFailedPairing onRetry={onRetry} onOpenHelp={onOpenHelp} productName={productName} />
    );
  } else {
    content = <BleDevicePairingProgress device={deviceToPair} productName={productName} />;
  }

  return (
    <Flex flex={1} width="100%">
      {content}

      {deviceLocked ? (
        <UnlockDeviceDrawer isOpen={true} device={deviceLocked} onClose={onRetry} />
      ) : null}
    </Flex>
  );
};

export default BleDevicePairing;
