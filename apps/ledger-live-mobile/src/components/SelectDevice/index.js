// @flow
import React, { useCallback, useEffect, useState } from "react";
import { StyleSheet, View, Platform, NativeModules } from "react-native";
import Config from "react-native-config";
import { useSelector, useDispatch } from "react-redux";
import { Trans } from "react-i18next";
import { useNavigation, useTheme } from "@react-navigation/native";
import { discoverDevices } from "@ledgerhq/live-common/lib/hw";
import type { TransportModule } from "@ledgerhq/live-common/lib/hw";
import type { Device } from "@ledgerhq/live-common/lib/hw/actions/types";
import Icon from "react-native-vector-icons/dist/Feather";
import { setHasConnectedDevice } from "../../actions/appstate";
import { ScreenName } from "../../const";
import { knownDevicesSelector } from "../../reducers/ble";
import DeviceItem from "./DeviceItem";
import BluetoothEmpty from "./BluetoothEmpty";
import USBEmpty from "./USBEmpty";
import LText from "../LText";
import Animation from "../Animation";
import Item from "./Item";

import lottieUsb from "../../screens/Onboarding/assets/nanoS/plugDevice/data.json";
import { track } from "../../analytics";

type Props = {
  onBluetoothDeviceAction?: (device: Device) => void,
  onSelect: (device: Device) => void,
  onWithoutDevice?: () => void,
  withArrows?: boolean,
  usbOnly?: boolean,
  filter?: (transportModule: TransportModule) => boolean,
  autoSelectOnAdd?: boolean,
};

export default function SelectDevice({
  usbOnly,
  withArrows,
  filter = () => true,
  onSelect,
  onWithoutDevice,
  onBluetoothDeviceAction,
  autoSelectOnAdd,
}: Props) {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const knownDevices = useSelector(knownDevicesSelector);
  const dispatch = useDispatch();

  const handleOnSelect = useCallback(
    deviceInfo => {
      const { modelId, wired } = deviceInfo;
      track("Device selection", {
        modelId,
        connectionType: wired ? "USB" : "BLE",
      });
      // Nb consider a device selection enough to show the fw update banner in portfolio
      dispatch(setHasConnectedDevice(true));
      onSelect(deviceInfo);
    },
    [dispatch, onSelect],
  );

  const [devices, setDevices] = useState([]);

  const onPairNewDevice = useCallback(() => {
    NativeModules.BluetoothHelperModule.prompt()
      .then(() =>
        navigation.navigate(ScreenName.PairDevices, {
          onDone: autoSelectOnAdd ? handleOnSelect : null,
        }),
      )
      .catch(() => {
        /* ignore */
      });
  }, [autoSelectOnAdd, navigation, handleOnSelect]);

  const renderItem = useCallback(
    (item: Device) => (
      <DeviceItem
        key={item.deviceId}
        deviceMeta={item}
        onSelect={handleOnSelect}
        withArrow={!!withArrows}
        onBluetoothDeviceAction={onBluetoothDeviceAction}
      />
    ),
    [withArrows, onBluetoothDeviceAction, handleOnSelect],
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
    return () => subscription.unsubscribe();
  }, [knownDevices, filter]);

  return (
    <>
      {usbOnly && withArrows ? (
        <UsbPlaceholder />
      ) : ble.length === 0 ? (
        <BluetoothEmpty onPairNewDevice={onPairNewDevice} />
      ) : (
        <View>
          <BluetoothHeader />
          {ble.map(renderItem)}
          <Item
            primary
            onPress={onPairNewDevice}
            event="AddDevice"
            icon={<Icon name="plus" color={colors.live} size={16} />}
            title={<Trans i18nKey="SelectDevice.deviceNotFoundPairNewDevice" />}
          />
        </View>
      )}
      {hasUSBSection &&
        !usbOnly &&
        (ble.length === 0 ? (
          <View style={[styles.separator, { backgroundColor: colors.live }]} />
        ) : (
          <USBHeader />
        ))}
      {other.length === 0 ? (
        <USBEmpty usbOnly={usbOnly} />
      ) : (
        other.map(renderItem)
      )}
      {onWithoutDevice && (
        <View>
          <WithoutDeviceHeader />
          <Item
            primary
            withArrow
            onPress={onWithoutDevice}
            event="WithoutDevice"
            title={<Trans i18nKey="SelectDevice.withoutDevice" />}
          />
        </View>
      )}
    </>
  );
}

const BluetoothHeader = () => (
  <View style={styles.header}>
    <LText style={styles.headerText} color="grey">
      <Trans i18nKey="common.bluetooth" />
    </LText>
  </View>
);

const USBHeader = () => (
  <LText style={styles.headerText} color="grey">
    <Trans i18nKey="common.usb" />
  </LText>
);

const WithoutDeviceHeader = () => (
  <View style={styles.header}>
    <LText style={styles.headerText} color="grey">
      <Trans i18nKey="SelectDevice.withoutDeviceHeader" />
    </LText>
  </View>
);

// Fixme Use the illustration instead of the png
const UsbPlaceholder = () => (
  <View style={styles.imageContainer}>
    <Animation style={styles.image} source={lottieUsb} />
  </View>
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerText: {
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 12,
  },
  separator: {
    width: "100%",
    height: 1,
    marginVertical: 24,
  },
  imageContainer: {
    minHeight: 200,
    position: "relative",
    overflow: "visible",
  },
  image: {
    position: "absolute",
    right: "-5%",
    top: 0,
    width: "110%",
    height: "100%",
  },
});
