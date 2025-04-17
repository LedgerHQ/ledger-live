import { useCallback, useEffect, useState } from "react";
import { DmkError } from "@ledgerhq/device-management-kit";
import { PeerRemovedPairing } from "@ledgerhq/errors";
import {
  rnBleTransportIdentifier,
  PeerRemovedPairingError,
} from "@ledgerhq/device-transport-kit-react-native-ble";
import { activeDeviceSessionSubject } from "@ledgerhq/live-dmk-shared";
import { Device } from "@ledgerhq/types-devices";
import { DeviceManagementKitBLETransport } from "../transport/DeviceManagementKitBLETransport";
import { useDeviceManagementKit } from "./useDeviceManagementKit";
import { getDeviceModel } from "@ledgerhq/devices";

type UseBleDevicePairingArgs = {
  device: Device;
};

type InternalPairingError = typeof PeerRemovedPairing | DmkError;

type UseBleDevicePairingResult = {
  isPaired: boolean;
  pairingError: InternalPairingError | null;
};

export const useBleDevicePairing = ({
  device,
}: UseBleDevicePairingArgs): UseBleDevicePairingResult => {
  const dmk = useDeviceManagementKit();
  const [isPaired, setIsPaired] = useState(false);
  const [pairingError, setPairingError] = useState<InternalPairingError | null>(null);
  const connectDevice = useCallback(async () => {
    try {
      if (!dmk) return;
      // TODO: Remove this connect call and use transport instead
      const sessionId = await dmk.connect({
        device: {
          id: device.deviceId,
          transport: rnBleTransportIdentifier,
          name: device.deviceName,
          deviceModel: device.modelId,
        },
        sessionRefresherOptions: { isRefresherDisabled: true },
      });
      const transport = new DeviceManagementKitBLETransport(dmk, sessionId);
      activeDeviceSessionSubject.next({ sessionId, transport });
      setIsPaired(true);
    } catch (error) {
      if (error instanceof PeerRemovedPairingError) {
        const remappedError = new PeerRemovedPairing(undefined, {
          deviceName: device.name,
          productName: getDeviceModel(device.modelId).productName,
        });
        setPairingError(remappedError as unknown as typeof PeerRemovedPairing);
      } else {
        setPairingError(error as DmkError);
      }
    }
  }, [dmk, device]);
  useEffect(() => {
    if (device) {
      connectDevice();
    }
  }, [device]);

  return { isPaired, pairingError };
};
