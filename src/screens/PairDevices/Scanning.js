// @flow

import React, { useState, useCallback, useEffect } from "react";
import { StyleSheet, FlatList } from "react-native";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { Observable } from "rxjs";
import logger from "../../logger";
import { BLE_SCANNING_NOTHING_TIMEOUT } from "../../constants";
import { knownDevicesSelector } from "../../reducers/ble";
import TransportBLE from "../../react-native-hw-transport-ble";
import { TrackScreen } from "../../analytics";
import DeviceItem from "../../components/SelectDevice/DeviceItem";
import ScanningHeader from "./ScanningHeader";

type Props = {
  onSelect: (device: Device, deviceMeta: *) => Promise<void>,
  onError: (error: Error) => void,
  onTimeout: () => void,
};

type Device = {
  id: string,
  name: string,
};

export default function Scanning({ onTimeout, onError, onSelect }: Props) {
  const { t } = useTranslation();
  const knownDevices = useSelector(knownDevicesSelector);
  const [devices, setDevices] = useState<Device[]>([]);

  const renderItem = useCallback(
    ({ item }) => {
      const knownDevice = knownDevices.find(d => d.id === item.id);
      const deviceMeta = {
        deviceId: item.id,
        deviceName: item.localName ?? item.name,
        wired: false,
        modelId: "nanoX",
      };
      return (
        <DeviceItem
          device={item}
          deviceMeta={deviceMeta}
          onSelect={() => onSelect(item, deviceMeta)}
          disabled={!!knownDevice}
          description={knownDevice ? t("PairDevices.alreadyPaired") : ""}
        />
      );
    },
    [onSelect, knownDevices, t],
  );

  useEffect(() => {
    const timeout = setTimeout(() => {
      onTimeout();
    }, BLE_SCANNING_NOTHING_TIMEOUT);

    const sub = Observable.create(TransportBLE.listen).subscribe({
      next: e => {
        if (e.type === "add") {
          clearTimeout(timeout);
          const device = e.descriptor;
          // FIXME seems like we have dup. ideally we'll remove them on the listen side!
          setDevices(devices =>
            devices.some(i => i.id === device.id)
              ? devices
              : [...devices, device],
          );
        }
      },
      error: error => {
        logger.critical(error);
        onError(error);
      },
    });

    return () => {
      sub.unsubscribe();
      clearTimeout(timeout);
    };
  }, [onTimeout, onError]);

  return (
    <>
      <TrackScreen category="PairDevices" name="Scanning" />
      <FlatList
        style={styles.list}
        data={devices}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        ListHeaderComponent={ScanningHeader}
      />
    </>
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
    paddingHorizontal: 16,
  },
});
