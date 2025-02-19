import { useCallback, useEffect, useState } from "react";
import { DmkError } from "@ledgerhq/device-management-kit";
import { rnBleTransportIdentifier } from "@ledgerhq/device-transport-kit-react-native-ble";
import { activeDeviceSessionSubject } from "@ledgerhq/live-dmk-shared";
import { Device } from "@ledgerhq/types-devices";
import { DeviceManagementKitTransport } from "../transport/DeviceManagementKitTransport";
import { useDeviceManagementKit } from "./useDeviceManagementKit";

export type useBleDevicePairingArgs = {
  device: Device;
};

export type useBleDevicePairingResult = {
  isPaired: boolean;
  pairingError: DmkError | null;
};

export const useBleDevicePairing = ({
  device,
}: useBleDevicePairingArgs): useBleDevicePairingResult => {
  const dmk = useDeviceManagementKit();
  const [isPaired, setIsPaired] = useState(false);
  const [pairingError, setPairingError] = useState<DmkError | null>(null);
  const connectDevice = useCallback(async () => {
    try {
      if (!dmk) return;
      const sessionId = await dmk.connect({
        device: {
          id: device.deviceId,
          transport: rnBleTransportIdentifier,
          name: device.deviceName,
          deviceModel: device.modelId,
        },
      });
      const transport = new DeviceManagementKitTransport(dmk, sessionId);
      activeDeviceSessionSubject.next({ sessionId, transport });
      setIsPaired(true);
    } catch (error) {
      setPairingError(error as DmkError);
    }
  }, [dmk, device]);
  useEffect(() => {
    if (device) {
      connectDevice();
    }
  }, [device]);

  return { isPaired, pairingError };
};
