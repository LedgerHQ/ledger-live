/**
 * NOTE: this is a work in progress. It does not yet follow mvvm architecture and has no tests,
 * the point for now it to allow manual testing of the DeviceIntentExecutor component.
 *
 * Initial implementation of the DeviceConnectionComponent for LWM.
 *
 * Performs real BLE device discovery via DMK and connects on user tap.
 *
 * TODO (final version):
 * - Use Lumen UI components instead of Native UI components
 * - HID transport support
 * - Full pairing UX (bonding, permissions prompts)
 * - Device model filtering from deviceConnectionParams.acceptedDeviceModelIds
 * - Loading/connecting states with animations
 * - Error display with retry
 * - MVVM architecture
 * - Tests
 */
import React, { useCallback, useState } from "react";
import { FlatList, StyleSheet, TouchableOpacity } from "react-native";
import { Text, Flex } from "@ledgerhq/native-ui";
import {
  useBleDevicesScanning,
  useDeviceManagementKit,
  type ScannedDevice,
} from "@ledgerhq/live-dmk-mobile";
import type { DeviceConnectionComponent } from "@ledgerhq/device-intent";

const DeviceConnectionComponentLWM: DeviceConnectionComponent = ({
  deviceConnectionParams: _deviceConnectionParams,
  onConnected,
  onError,
}) => {
  const dmk = useDeviceManagementKit();
  const { scannedDevices, isScanning } = useBleDevicesScanning(true);
  const [connectingDeviceId, setConnectingDeviceId] = useState<string | null>(null);

  const handleDevicePress = useCallback(
    async (device: ScannedDevice) => {
      if (!dmk || !device.discoveredDevice) return;
      setConnectingDeviceId(device.deviceId);
      try {
        const sessionId = await dmk.connect({
          device: device.discoveredDevice,
          sessionRefresherOptions: { isRefresherDisabled: true },
        });
        const connectedDevice = dmk.getConnectedDevice({ sessionId });
        onConnected({
          dmk,
          sessionId,
          compatDeviceId: device.deviceId,
          connectedDevice,
          compatDeviceModelId: device.modelId,
          compatDeviceName: connectedDevice.name,
          compatDeviceWired: connectedDevice.type === "USB",
        });
      } catch (error) {
        setConnectingDeviceId(null);
        onError(error);
      }
    },
    [dmk, onConnected, onError],
  );

  const renderDevice = useCallback(
    ({ item }: { item: ScannedDevice }) => (
      <TouchableOpacity
        style={styles.deviceRow}
        onPress={() => handleDevicePress(item)}
        disabled={connectingDeviceId !== null}
      >
        <Text variant="body" fontWeight="semiBold">
          {item.deviceName || "Unnamed device"}
        </Text>
        <Text variant="small" color="neutral.c70">
          {item.modelId}
          {connectingDeviceId === item.deviceId ? " — connecting…" : ""}
        </Text>
      </TouchableOpacity>
    ),
    [handleDevicePress, connectingDeviceId],
  );

  return (
    <Flex p={4}>
      <Text variant="h5" mb={4}>
        {isScanning ? "Scanning for devices…" : "Select a device"}
      </Text>
      <FlatList
        data={scannedDevices}
        keyExtractor={d => d.deviceId}
        renderItem={renderDevice}
        ListEmptyComponent={
          <Text variant="body" color="neutral.c70">
            {isScanning ? "Looking for nearby devices…" : "No devices found."}
          </Text>
        }
      />
    </Flex>
  );
};

const styles = StyleSheet.create({
  deviceRow: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ccc",
  },
});

export default DeviceConnectionComponentLWM;
