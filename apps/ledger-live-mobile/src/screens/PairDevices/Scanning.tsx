import React, { useState, useCallback, useEffect } from "react";
import { StyleSheet, FlatList } from "react-native";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { Observable } from "rxjs";
import { InfiniteLoader } from "@ledgerhq/native-ui";
import { getInfosForServiceUuid, DeviceModelId } from "@ledgerhq/devices";
import { DescriptorEvent } from "@ledgerhq/hw-transport";
import BleTransport from "../../hw-transport-react-native-ble";
import logger from "../../logger";
import { BLE_SCANNING_NOTHING_TIMEOUT } from "../../constants";
import { knownDevicesSelector } from "../../reducers/ble";
import { TrackScreen } from "../../analytics";
import DeviceItem from "../../components/SelectDevice/DeviceItem";
import ScanningHeader from "./ScanningHeader";

type Props = {
  onSelect: (device: Device, deviceMeta: any) => Promise<void>;
  onError: (_: Error) => void;
  onTimeout: () => void;
};

type Device = {
  id: string;
  name: string;
};

export default function Scanning({ onTimeout, onError, onSelect }: Props) {
  const { t } = useTranslation();
  const knownDevices = useSelector(knownDevicesSelector);
  const [devices, setDevices] = useState<Device[]>([]);

  const renderItem = useCallback(
    ({ item }) => {
      const knownDevice = knownDevices.find(d => d.id === item.id);
      let modelId = "nanoX" as DeviceModelId;
      const infos = getInfosForServiceUuid(item.serviceUUIDs[0]);
      if (infos) modelId = infos.deviceModel.id;

      const deviceMeta = {
        deviceId: item.id,
        deviceName: item.localName ?? item.name,
        wired: false,
        modelId,
      };
      return (
        <DeviceItem
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
      next: (e: DescriptorEvent<Device>) => {
        if (e.type === "add") {
          clearTimeout(timeout);
          const device = e.descriptor;
          setDevices(devices => [...devices, device]);
        }
      },
      error: (error: Error) => {
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
        ListEmptyComponent={<InfiniteLoader size={58} />}
      />
    </>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: 16,
  },
});
