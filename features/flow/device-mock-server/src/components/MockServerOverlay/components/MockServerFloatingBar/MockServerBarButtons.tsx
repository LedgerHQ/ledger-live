import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Box, Text } from "@ledgerhq/lumen-ui-rnative";
import { Devices } from "@ledgerhq/lumen-ui-rnative/symbols";
import type { MockServerStatus } from "../../../../useMockServerStatus";
import type { MockServerOverlayDevice } from "../../types";
import { getDeviceSymbol } from "./deviceSymbols";

export const BAR_BUTTON_SIZE = 40;
const BAR_BUTTON_GAP = 4;

export const getBarButtonsWidth = (deviceCount: number) =>
  (deviceCount + 1) * BAR_BUTTON_SIZE + deviceCount * BAR_BUTTON_GAP;

const MAIN_BUTTON_BACKGROUNDS = {
  checking: "black",
  connected: "successStrong",
  unreachable: "errorStrong",
  sessionExpired: "errorStrong",
} as const satisfies Record<MockServerStatus, string>;

const DEVICE_BUTTON_COLORS = {
  light: { background: "black", foreground: "white" },
  dark: { background: "white", foreground: "black" },
} as const;

type Props = {
  status: MockServerStatus;
  colorScheme: "light" | "dark";
  devices: readonly MockServerOverlayDevice[];
  selectedDeviceId: string | null;
  onPressMain: () => void;
  onPressDevice: (deviceId: string) => void;
};

export function MockServerBarButtons({
  status,
  colorScheme,
  devices,
  selectedDeviceId,
  onPressMain,
  onPressDevice,
}: Readonly<Props>) {
  const deviceButtonColors = DEVICE_BUTTON_COLORS[colorScheme];

  return (
    <View style={styles.row}>
      <Pressable onPress={onPressMain} testID="mock-server-floating-button">
        <Box
          style={styles.button}
          lx={{ backgroundColor: MAIN_BUTTON_BACKGROUNDS[status], borderRadius: "md" }}
        >
          <Devices size={24} color="white" />
        </Box>
      </Pressable>
      {devices.map(device => {
        const DeviceSymbol = getDeviceSymbol(device.modelId);
        return (
          <Pressable
            key={device.id}
            onPress={() => onPressDevice(device.id)}
            testID={`mock-server-device-button-${device.number}`}
            accessibilityLabel={`Show ${device.name}`}
          >
            <Box
              style={styles.button}
              lx={{
                backgroundColor:
                  device.id === selectedDeviceId ? "accent" : deviceButtonColors.background,
                borderRadius: "md",
              }}
            >
              <DeviceSymbol size={24} color={deviceButtonColors.foreground} />
              <Text
                typography="body4"
                style={[styles.deviceNumber, { color: deviceButtonColors.foreground }]}
              >
                #{device.number}
              </Text>
            </Box>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: BAR_BUTTON_GAP },
  button: {
    width: BAR_BUTTON_SIZE,
    height: BAR_BUTTON_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  deviceNumber: { position: "absolute", right: 2, bottom: 0, fontSize: 9 },
});
