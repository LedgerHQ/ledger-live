import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { webBleTransportIdentifier } from "@ledgerhq/live-dmk-desktop";
import type { BluetoothDeviceCandidate, BluetoothSelectionRequest } from "~/bridge/contract";
import { bluetooth } from "~/renderer/bridge";
import { useSelector } from "LLD/hooks/redux";
import { knownDevicesSelector } from "~/renderer/reducers/knownDevices";
import { recordBluetoothSelection } from "./bluetoothSelection";

export type BluetoothDeviceChooserViewModel = {
  isOpen: boolean;
  devices: BluetoothDeviceCandidate[];
  onSelect: (deviceId: string) => void;
  onCancel: () => void;
};

/**
 * Answers the main-process Bluetooth selection requests: a remembered device found by the scan is
 * selected right away, otherwise the user picks one in a list. Never selects an unknown device.
 */
export function useBluetoothDeviceChooser(): BluetoothDeviceChooserViewModel {
  const knownDevices = useSelector(knownDevicesSelector);
  const rememberedDeviceIds = useMemo(
    () =>
      new Set(
        knownDevices
          .filter(device => device.transport === webBleTransportIdentifier)
          .map(device => device.id),
      ),
    [knownDevices],
  );
  // Read from the bridge callbacks, which are subscribed once.
  const rememberedDeviceIdsRef = useRef(rememberedDeviceIds);
  useEffect(() => {
    rememberedDeviceIdsRef.current = rememberedDeviceIds;
  }, [rememberedDeviceIds]);

  const [request, setRequest] = useState<BluetoothSelectionRequest | null>(null);
  // The scan keeps reporting candidates, so ignore the request once it has been answered.
  const answeredRequestIdRef = useRef<number | null>(null);

  const answer = useCallback((requestId: number, deviceId: string | null) => {
    answeredRequestIdRef.current = requestId;
    recordBluetoothSelection(deviceId ? { type: "selected", deviceId } : { type: "cancelled" });
    bluetooth.selectDevice(requestId, deviceId);
    setRequest(null);
  }, []);

  useEffect(() => {
    const unsubscribeRequest = bluetooth.onSelectionRequest(nextRequest => {
      if (nextRequest.requestId === answeredRequestIdRef.current) return;

      const rememberedDevice = nextRequest.devices.find(device =>
        rememberedDeviceIdsRef.current.has(device.deviceId),
      );
      if (rememberedDevice) {
        answer(nextRequest.requestId, rememberedDevice.deviceId);
        return;
      }
      setRequest(nextRequest);
    });
    const unsubscribeEnd = bluetooth.onSelectionEnd(requestId => {
      setRequest(current => (current?.requestId === requestId ? null : current));
    });

    return () => {
      unsubscribeRequest();
      unsubscribeEnd();
    };
  }, [answer]);

  const onSelect = useCallback(
    (deviceId: string) => {
      if (request) answer(request.requestId, deviceId);
    },
    [answer, request],
  );

  const onCancel = useCallback(() => {
    if (request) answer(request.requestId, null);
  }, [answer, request]);

  return {
    isOpen: request !== null,
    devices: request?.devices ?? [],
    onSelect,
    onCancel,
  };
}
