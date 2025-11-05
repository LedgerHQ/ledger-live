import { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { bleDevicesSelector } from "~/reducers/ble";
import { ScannedDevice } from "@ledgerhq/live-dmk-mobile";

type EnrichedScannedDevice = ScannedDevice & {
  isAlreadyKnown: boolean;
  grayedOut: boolean;
  discoveryStableOrder: number;
};

type Args = {
  devices: ScannedDevice[];
  areKnownDevicesPairable?: boolean;
};

export function useOrderedBleScannedDevices({ devices, areKnownDevicesPairable }: Args) {
  const [listVersion, setListVersion] = useState(0);

  const knownDevices = useSelector(bleDevicesSelector);
  const knownDeviceIds = useMemo(() => knownDevices.map(d => d.id), [knownDevices]);
  const knownIdSet = useMemo(() => new Set(knownDeviceIds), [knownDeviceIds]);

  type TrackedDeviceState = {
    latestScannedSnapshot: ScannedDevice;
    isCurrentlyVisibleInScan: boolean;
    firstSeenSequenceNumber: number;
  };

  const trackedDeviceStateByIdRef = useRef<Map<string, TrackedDeviceState>>(new Map());
  const nextFirstSeenSequenceNumberRef = useRef<number>(0);

  useEffect(() => {
    let didTrackedStateChange = false;

    const deviceIdsVisibleInThisScan = new Set<string>(
      devices.map(scannedDevice => scannedDevice.deviceId),
    );

    for (const scannedDevice of devices) {
      const existingTrackedState = trackedDeviceStateByIdRef.current.get(scannedDevice.deviceId);

      if (!existingTrackedState) {
        trackedDeviceStateByIdRef.current.set(scannedDevice.deviceId, {
          latestScannedSnapshot: scannedDevice,
          isCurrentlyVisibleInScan: true,
          firstSeenSequenceNumber: nextFirstSeenSequenceNumberRef.current++,
        });
        didTrackedStateChange = true;
        continue;
      }

      const didSnapshotReferenceChange =
        existingTrackedState.latestScannedSnapshot !== scannedDevice;

      if (didSnapshotReferenceChange || existingTrackedState.isCurrentlyVisibleInScan !== true) {
        trackedDeviceStateByIdRef.current.set(scannedDevice.deviceId, {
          latestScannedSnapshot: scannedDevice,
          isCurrentlyVisibleInScan: true,
          firstSeenSequenceNumber: existingTrackedState.firstSeenSequenceNumber,
        });
        didTrackedStateChange = true;
      }
    }

    for (const [deviceId, trackedState] of trackedDeviceStateByIdRef.current) {
      if (!deviceIdsVisibleInThisScan.has(deviceId) && trackedState.isCurrentlyVisibleInScan) {
        trackedDeviceStateByIdRef.current.set(deviceId, {
          ...trackedState,
          isCurrentlyVisibleInScan: false,
        });
        didTrackedStateChange = true;
      }
    }

    if (didTrackedStateChange) setListVersion(v => v + 1);
  }, [devices]);

  const displayListVersion = listVersion;

  const displayedDevices: EnrichedScannedDevice[] = useMemo(() => {
    const enriched: EnrichedScannedDevice[] = [];

    for (const [deviceId, trackedState] of trackedDeviceStateByIdRef.current) {
      const isAlreadyKnownForSorting = knownIdSet.has(deviceId) && !areKnownDevicesPairable;

      enriched.push({
        ...trackedState.latestScannedSnapshot,
        isAlreadyKnown: isAlreadyKnownForSorting,
        grayedOut: !trackedState.isCurrentlyVisibleInScan,
        discoveryStableOrder: trackedState.firstSeenSequenceNumber,
      });
    }

    enriched.sort((a, b) => {
      const knownGroupOrder = Number(a.isAlreadyKnown) - Number(b.isAlreadyKnown);
      if (knownGroupOrder !== 0) return knownGroupOrder;

      return a.discoveryStableOrder - b.discoveryStableOrder;
    });

    return enriched;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayListVersion, areKnownDevicesPairable, knownIdSet]);

  return { displayedDevices, knownDeviceIds };
}
