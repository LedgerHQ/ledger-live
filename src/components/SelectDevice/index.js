// @flow
import React, { useCallback, useEffect, useState } from "react";
import { StyleSheet, View, Platform, Image } from "react-native";
import Config from "react-native-config";
import { useSelector } from "react-redux";
import { Trans } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import { discoverDevices } from "@ledgerhq/live-common/lib/hw";
import type { TransportModule } from "@ledgerhq/live-common/lib/hw";
import type { Device } from "@ledgerhq/live-common/lib/hw/actions/types";
import { ScreenName } from "../../const";
import { knownDevicesSelector } from "../../reducers/ble";
import DeviceItem from "../DeviceItem";
// import { setReadOnlyMode, installAppFirstTime } from "../../actions/settings";
import BluetoothEmpty from "./BluetoothEmpty";
import USBEmpty from "./USBEmpty";
import LText from "../LText";
import colors from "../../colors";
import SectionSeparator from "../SectionSeparator";
import PairNewDeviceButton from "./PairNewDeviceButton";

type Props = {
  onBluetoothDeviceAction?: (device: Device) => void,
  onSelect: (device: Device) => void,
  withArrows?: boolean,
  usbOnly?: boolean,
  filter?: (transportModule: TransportModule) => boolean,
};

export default function SelectDevice({
  usbOnly,
  withArrows,
  filter = () => true,
  onSelect,
  onBluetoothDeviceAction,
}: Props) {
  const navigation = useNavigation();
  const knownDevices = useSelector(knownDevicesSelector);

  const [devices, setDevices] = useState([]);

  const onPairNewDevice = useCallback(() => {
    navigation.navigate(ScreenName.PairDevices);
  }, [navigation]);

  const renderItem = useCallback(
    (item: Device) => (
      <DeviceItem
        key={item.deviceId}
        deviceMeta={item}
        onSelect={onSelect}
        withArrow={!!withArrows}
        onBluetoothDeviceAction={onBluetoothDeviceAction}
      />
    ),
    [withArrows, onBluetoothDeviceAction, onSelect],
  );

  const all: Device[] = getAll({ knownDevices }, { devices });

  const [ble, other] = all.reduce(
    ([ble, other], device) =>
      device.wired ? [ble, [...other, device]] : [[...ble, device], other],
    [[], []],
  );

  const hasUSBSection = Platform.OS === "android" || other.length > 0;

  useEffect(() => {
    const subscription = discoverDevices(filter).subscribe(e => {
      setDevices(devices => {
        if (e.type !== "add") {
          return devices.filter(d => d.deviceId !== e.id);
        }

        if (!devices.find(d => d.deviceId === e.id)) {
          return [
            ...devices,
            {
              deviceId: e.id,
              deviceName: e.name || "",
              modelId:
                (e.deviceModel && e.deviceModel.id) ||
                Config.FALLBACK_DEVICE_MODEL_ID ||
                "nanoX",
              wired: e.id.startsWith("httpdebug|")
                ? Config.FALLBACK_DEVICE_WIRED === "YES"
                : e.id.startsWith("usb|"),
            },
          ];
        }

        return devices;
      });
    });
    return () => subscription.unsubscribe;
  }, [knownDevices, filter]);

  return (
    <View>
      {usbOnly && withArrows ? (
        <UsbPlaceholder />
      ) : ble.length === 0 ? (
        <BluetoothEmpty onPairNewDevice={onPairNewDevice} />
      ) : (
        <View>
          <BluetoothHeader />
          {ble.map(renderItem)}
          <PairNewDeviceButton onPress={onPairNewDevice} />
        </View>
      )}
      {hasUSBSection &&
        !usbOnly &&
        (ble.length === 0 ? <ORBar /> : <USBHeader />)}
      {other.length === 0 ? <USBEmpty /> : other.map(renderItem)}
    </View>
  );
}

const BluetoothHeader = () => (
  <View style={styles.bluetoothHeader}>
    <LText semiBold style={styles.section}>
      <Trans i18nKey="common.bluetooth" />
    </LText>
  </View>
);

const USBHeader = () => (
  <LText semiBold style={styles.section}>
    <Trans i18nKey="common.usb" />
  </LText>
);

// Fixme Use the illustration instead of the png
const UsbPlaceholder = () => (
  <View style={styles.usbContainer}>
    <Image source={require("../../images/connect-nanos-mobile.png")} />
  </View>
);

const ORBar = () => (
  <SectionSeparator
    thin
    style={styles.or}
    text={<Trans i18nKey="common.or" />}
  />
);

function getAll({ knownDevices }, { devices }): Device[] {
  return [
    ...devices,
    ...knownDevices.map(d => ({
      deviceId: d.id,
      deviceName: d.name || "",
      wired: false,
      modelId: "nanoX",
    })),
  ];
}

const styles = StyleSheet.create({
  section: {
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 12,
    color: colors.grey,
  },
  addContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  add: {
    marginRight: 8,
    color: colors.live,
  },
  bluetoothHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  or: {
    marginVertical: 30,
  },
  usbContainer: {
    alignItems: "center",
    marginVertical: 30,
  },
});
