import React, { useState, useCallback, useEffect, useMemo } from "react";
import { FlatList } from "react-native";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { Observable } from "rxjs";
import { InfiniteLoader, Flex } from "@ledgerhq/native-ui";
import { getInfosForServiceUuid, DeviceModelId } from "@ledgerhq/devices";
import { DescriptorEvent } from "@ledgerhq/hw-transport";
import { Device as DeviceMeta } from "@ledgerhq/live-common/hw/actions/types";
import { TransportBleDevice } from "@ledgerhq/live-common/ble/types";
import logger from "../../logger";
import { BLE_SCANNING_NOTHING_TIMEOUT } from "~/utils/constants";
import { knownDevicesSelector } from "~/reducers/ble";
import TransportBLE from "../../react-native-hw-transport-ble";
import { TrackScreen } from "~/analytics";
import DeviceItem from "~/components/SelectDevice/DeviceItem";
import ScanningHeader from "./ScanningHeader";
import Config from "react-native-config";

type Props = {
  onSelect: (device: TransportBleDevice, deviceMeta?: DeviceMeta) => Promise<void>;
  onError: (_: Error) => void;
  onTimeout: () => void;
  /** If defined, only show devices that have a device model id in this array */
  deviceModelIds?: DeviceModelId[];
};

export default function Scanning({ onTimeout, onError, onSelect, deviceModelIds }: Props) {
  const { t } = useTranslation();
  const knownDevices = useSelector(knownDevicesSelector);
  const [devices, setDevices] = useState<TransportBleDevice[]>([]);

  const filteredDevices = useMemo(() => {
    if (!deviceModelIds) return devices;
    return devices.filter(device => {
      let modelId = "nanoX" as DeviceModelId;
      const infos = device?.serviceUUIDs && getInfosForServiceUuid(device.serviceUUIDs[0]);
      if (infos) modelId = infos.deviceModel.id;
      return deviceModelIds.includes(modelId);
    });
  }, [devices, deviceModelIds]);

  const renderItem = useCallback(
    ({ item }: { item: TransportBleDevice }) => {
      const knownDevice = knownDevices.find(d => d.id === item.id);
      let modelId = "nanoX" as DeviceModelId;
      const infos = item.serviceUUIDs && getInfosForServiceUuid(item.serviceUUIDs[0]);
      if (infos) modelId = infos.deviceModel.id;

      const deviceMeta = {
        deviceId: item.id,
        deviceName: item.localName ?? (item.name || undefined),
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
      next: (e: DescriptorEvent<TransportBleDevice>) => {
        if (e.type === "add") {
          clearTimeout(timeout);
          const device = e.descriptor;
          // FIXME seems like we have dup. ideally we'll remove them on the listen side!
          setDevices(devices =>
            devices.some(i => i.id === device.id) ? devices : [...devices, device],
          );
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
      <Flex flex={1} px={6}>
        <FlatList
          data={filteredDevices}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          ListHeaderComponent={ScanningHeader}
          ListEmptyComponent={<InfiniteLoader size={58} mock={Config.MOCK} />}
        />
      </Flex>
    </>
  );
}
