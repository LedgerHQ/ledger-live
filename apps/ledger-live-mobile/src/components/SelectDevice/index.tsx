import React, { useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, View, Platform } from "react-native";
import Config from "react-native-config";
import { useSelector, useDispatch } from "react-redux";
import { Trans } from "react-i18next";
import { useNavigation, useRoute, useTheme as useNavTheme } from "@react-navigation/native";
import { discoverDevices } from "@ledgerhq/live-common/hw/index";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { Flex } from "@ledgerhq/native-ui";
import { useTheme } from "styled-components/native";
import { ScreenName } from "~/const";
import { knownDevicesSelector } from "~/reducers/ble";
import { setHasConnectedDevice } from "~/actions/appstate";
import DeviceItem from "./DeviceItem";
import BluetoothEmpty from "./BluetoothEmpty";
import USBEmpty from "./USBEmpty";
import LText from "../LText";
import Animation from "../Animation";
import { track } from "~/analytics";
import { setLastConnectedDevice, setReadOnlyMode } from "~/actions/settings";
import Button from "../wrappedUi/Button";

import PairLight from "~/screens/Onboarding/assets/nanoX/pairDevice/light.json";
import PairDark from "~/screens/Onboarding/assets/nanoX/pairDevice/dark.json";
import { DeviceLike } from "~/reducers/types";
import { useResetOnNavigationFocusState } from "~/helpers/useResetOnNavigationFocusState";
import { useDebouncedRequireBluetooth } from "../RequiresBLE/hooks/useRequireBluetooth";
import RequiresBluetoothDrawer from "../RequiresBLE/RequiresBluetoothDrawer";

type Props = {
  withArrows?: boolean;
  usbOnly?: boolean;
  autoSelectOnAdd?: boolean;
  hideAnimation?: boolean;
  /** If defined, only show devices that have a device model id in this array */
  deviceModelIds?: DeviceModelId[];
  onBluetoothDeviceAction?: (_: Device) => void;
  onSelect: (_: Device) => void;
  onWithoutDevice?: () => void;
};

export default function SelectDevice({
  usbOnly,
  withArrows,
  autoSelectOnAdd,
  hideAnimation,
  deviceModelIds,
  onSelect,
  onWithoutDevice,
  onBluetoothDeviceAction,
}: Props) {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const knownDevices = useSelector(knownDevicesSelector);
  const dispatch = useDispatch();
  const route = useRoute();

  // Each time the user navigates back to the screen the BLE requirements are not enforced
  const [isBleRequired, setIsBleRequired] = useResetOnNavigationFocusState(navigation, false);

  // To be able to triggers the device selection once all the bluetooth requirements are respected
  const [
    lastSelectedDeviceBeforeRequireBluetoothCheck,
    setLastSelectedDeviceBeforeRequireBluetoothCheck,
  ] = useState<Device | null>(null);

  // Enforces the BLE requirements for a "connecting" action. The requirements are only enforced
  // if the bluetooth is needed (isBleRequired is true).
  const { bluetoothRequirementsState, retryRequestOnIssue, cannotRetryRequest } =
    useDebouncedRequireBluetooth({
      requiredFor: "connecting",
      isHookEnabled: isBleRequired,
    });

  // If the user tries to close the drawer displaying issues on BLE requirements,
  // this cancels the requirements checking and does not do anything in order to stop the
  // connection with a device via BLE
  const onUserCloseRequireBluetoothDrawer = useCallback(() => {
    setIsBleRequired(false);
  }, [setIsBleRequired]);

  const handleOnSelect = useCallback(
    (device: Device) => {
      const { modelId, wired } = device;

      if (wired) {
        track("Device selection", {
          modelId,
          connectionType: "USB",
        });

        dispatch(setLastConnectedDevice(device));
        dispatch(setHasConnectedDevice(true));
        onSelect(device);
        dispatch(setReadOnlyMode(false));
        return;
      }

      // If not wired, bluetooth is required
      if (!isBleRequired) {
        setLastSelectedDeviceBeforeRequireBluetoothCheck(device);
        setIsBleRequired(true);
        return;
      }

      // Normally, if isBleRequired is true, and the user managed to click to select a device
      // then all the bluetooth requirements should be respected. But to be sure no UI glitch
      // happened, checks the bluetoothRequirementsState
      if (bluetoothRequirementsState !== "all_respected") {
        setLastSelectedDeviceBeforeRequireBluetoothCheck(device);
        return;
      }

      track("Device selection", {
        modelId,
        connectionType: "BLE",
      });

      dispatch(setLastConnectedDevice(device));
      dispatch(setHasConnectedDevice(true));
      onSelect(device);
      dispatch(setReadOnlyMode(false));
    },
    [bluetoothRequirementsState, dispatch, isBleRequired, onSelect, setIsBleRequired],
  );

  // Once all the bluetooth requirements are respected, the device selection is triggered
  useEffect(() => {
    if (
      bluetoothRequirementsState === "all_respected" &&
      lastSelectedDeviceBeforeRequireBluetoothCheck
    ) {
      handleOnSelect(lastSelectedDeviceBeforeRequireBluetoothCheck);
      setLastSelectedDeviceBeforeRequireBluetoothCheck(null);
    }
  }, [bluetoothRequirementsState, lastSelectedDeviceBeforeRequireBluetoothCheck, handleOnSelect]);

  // When a new pairing (with a navigation) occurs, this component gets unmounted/remounted
  // Therefore, its state (isBleRequired, or a selectedDevice) cannot be updated.
  // No checks on the bluetooth requirements can done from this component because of this.
  // The only thing that can be done is dispatch some info + call onSelect from the parent component.
  // Pairing a new device, coming back to the screen rendering this component and then removing bluetooth is a possible edge case.
  const handleOnPairNewDeviceDone = useCallback(
    (device: Device) => {
      if (!autoSelectOnAdd) return;

      const { modelId, wired } = device;

      if (wired) {
        track("Device selection", {
          modelId,
          connectionType: "USB",
        });

        dispatch(setLastConnectedDevice(device));
        dispatch(setHasConnectedDevice(true));
        onSelect(device);
        dispatch(setReadOnlyMode(false));
        return;
      }

      track("Device selection", {
        modelId,
        connectionType: "BLE",
      });

      dispatch(setLastConnectedDevice(device));
      dispatch(setHasConnectedDevice(true));
      onSelect(device);
      dispatch(setReadOnlyMode(false));
    },
    [autoSelectOnAdd, dispatch, onSelect],
  );

  const onPairNewDevice = useCallback(() => {
    track("button_clicked", {
      button: "Pair with bluetooth",
      page: route.name,
    });

    // We should not pass non-serializable param like onDone when navigating.
    // Fixed in the new SelectDevice2.
    navigation.navigate(ScreenName.PairDevices, {
      onDone: handleOnPairNewDeviceDone,
      deviceModelIds,
    });
  }, [route.name, navigation, handleOnPairNewDeviceDone, deviceModelIds]);

  const [devices, setDevices] = useState<Device[]>([]);

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

  const all: Device[] = useMemo(() => {
    return getAll({ knownDevices }, { devices }).filter(device => {
      if (!deviceModelIds) return true;
      return deviceModelIds.includes(device.modelId);
    });
  }, [knownDevices, devices, deviceModelIds]);

  const [ble, other] = all.reduce<[Array<Device>, Array<Device>]>(
    ([ble, other], device) =>
      device.wired ? [ble, [...other, device]] : [[...ble, device], other],
    [[], []],
  );

  const hasUSBSection = Platform.OS === "android" || other.length > 0;

  useEffect(() => {
    const filter = ({ id }: { id: string }) => ["hid", "httpdebug"].includes(id);
    const subscription = discoverDevices(filter).subscribe(e => {
      setDevices(devices => {
        const isUSBDevice = e.id.startsWith("usb|");
        if (e.type === "remove") {
          return devices.filter(({ deviceId }) =>
            isUSBDevice ? !deviceId.startsWith("usb|") : deviceId !== e.id,
          );
        }

        const modelId =
          (e.deviceModel && (e.deviceModel.id as DeviceModelId)) ||
          (Config?.FALLBACK_DEVICE_MODEL_ID as DeviceModelId) ||
          "nanoX";

        const wired = e.id.startsWith("httpdebug|")
          ? Config?.FALLBACK_DEVICE_WIRED === "YES"
          : isUSBDevice;

        const deviceAlreadyListed = devices.find(d => d.deviceId === e.id);

        if (!deviceAlreadyListed) {
          // Nb wired devices seem to return a new id every time, instead of
          // relying on the id, we can filter out all USB devices instead.
          const device = {
            deviceId: e.id,
            deviceName: e.name || "",
            modelId,
            wired,
          };

          const maybeFilteredDevices = isUSBDevice
            ? devices.filter(({ deviceId }) => !deviceId.startsWith("usb|"))
            : devices;

          return [...maybeFilteredDevices, device];
        }

        return devices;
      });
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <>
      <RequiresBluetoothDrawer
        isOpenedOnIssue={isBleRequired}
        onUserClose={onUserCloseRequireBluetoothDrawer}
        bluetoothRequirementsState={bluetoothRequirementsState}
        retryRequestOnIssue={retryRequestOnIssue}
        cannotRetryRequest={cannotRetryRequest}
      />

      <Flex flexDirection={"column"} alignSelf="stretch">
        {usbOnly && withArrows && !hideAnimation ? (
          <UsbPlaceholder />
        ) : usbOnly ? null : ble.length === 0 ? (
          <BluetoothEmpty hideAnimation={hideAnimation} onPairNewDevice={onPairNewDevice} />
        ) : (
          <View>
            <BluetoothHeader />
            {ble.map(renderItem)}
            <Button onPress={onPairNewDevice} event="AddDevice" type={"main"} mt={6} mb={6}>
              <Trans i18nKey="SelectDevice.deviceNotFoundPairNewDevice" />
            </Button>
          </View>
        )}
        {hasUSBSection &&
          !usbOnly &&
          (ble.length === 0 ? (
            <View style={[styles.separator, { backgroundColor: colors.neutral.c40 }]} />
          ) : (
            <USBHeader />
          ))}
        {!hasUSBSection ? null : other.length === 0 ? (
          <USBEmpty usbOnly={usbOnly} />
        ) : (
          other.map(renderItem)
        )}
        {onWithoutDevice && (
          <View>
            <WithoutDeviceHeader />
            <Button onPress={onWithoutDevice} event="WithoutDevice" type={"main"} mt={6} mb={6}>
              <Trans i18nKey="SelectDevice.withoutDevice" />
            </Button>
          </View>
        )}
      </Flex>
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
const UsbPlaceholder = () => {
  const { dark } = useNavTheme();
  return (
    <View style={styles.imageContainer}>
      <Animation style={styles.image} source={dark ? PairDark : PairLight} />
    </View>
  );
};

function getAll(
  { knownDevices }: { knownDevices: DeviceLike[] },
  { devices }: { devices: Device[] },
): Device[] {
  return [
    ...devices,
    ...knownDevices.map(d => ({
      deviceId: d.id,
      deviceName: d.name || "",
      wired: false,
      modelId: d.modelId || DeviceModelId.nanoX,
    })),
  ];
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    alignSelf: "stretch",
  },
  headerText: {
    fontSize: 14,
    lineHeight: 21,
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
