import React, { useCallback, useRef, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Box, Button, Switch, Text } from "@ledgerhq/lumen-ui-rnative";
import type { DeviceConnectionResult } from "@ledgerhq/live-dmk-shared";
import { ConnectKnownOrNewDevice } from "LLM/components/ConnectKnownOrNewDevice";

type LogEvent = "onConnected" | "onAddModeChange" | "onDeviceNotFound";

type LogEntry = {
  id: number;
  time: string;
  event: LogEvent;
  details?: string;
};

const MAX_LOG_ENTRIES = 50;

/**
 * Shows ConnectKnownOrNewDevice the way My Wallet does. The switches and the log of the callback
 * calls stay at the bottom: a caller can set the prop at any time.
 */
export default function DebugConnectKnownOrNewDeviceScreen() {
  const logIdRef = useRef(0);
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [autoPausesOnConnect, setAutoPausesOnConnect] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const { bottom: bottomInset } = useSafeAreaInsets();

  const log = useCallback((event: LogEvent, details?: string) => {
    setLogEntries(entries =>
      [{ id: logIdRef.current++, time: formatTime(new Date()), event, details }, ...entries].slice(
        0,
        MAX_LOG_ENTRIES,
      ),
    );
  }, []);

  const onConnected = useCallback(
    (result: DeviceConnectionResult) => {
      log("onConnected", formatConnectionResult(result));
      if (autoPausesOnConnect) {
        setIsPaused(true);
      }
    },
    [autoPausesOnConnect, log],
  );
  const onAddModeChange = useCallback(
    (adding: boolean) => {
      log("onAddModeChange", `isAdding ${adding}`);
      setIsAdding(adding);
    },
    [log],
  );
  const onDeviceNotFound = useCallback(() => log("onDeviceNotFound"), [log]);

  return (
    <Box lx={{ flex: 1, backgroundColor: "canvas" }}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={isAdding ? styles.fill : undefined}>
          <ConnectKnownOrNewDevice
            sourceFlow="debug"
            onConnected={onConnected}
            onAddModeChange={onAddModeChange}
            isPaused={isPaused}
            onDeviceNotFound={onDeviceNotFound}
          />
        </View>
      </ScrollView>
      <Box
        lx={{ paddingHorizontal: "s16", paddingTop: "s12", gap: "s12" }}
        style={{ paddingBottom: 16 + bottomInset }}
      >
        <Box
          lx={{
            ...cardStyle,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text typography="body2" lx={{ color: "base" }}>
            isPaused
          </Text>
          <Switch checked={isPaused} onCheckedChange={setIsPaused} />
        </Box>
        <Box
          lx={{
            ...cardStyle,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text typography="body2" lx={{ color: "base" }}>
            Auto pauses on connect
          </Text>
          <Switch checked={autoPausesOnConnect} onCheckedChange={setAutoPausesOnConnect} />
        </Box>
        <Box lx={cardStyle} style={styles.log}>
          <Box lx={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text typography="body2SemiBold" lx={{ color: "base" }}>
              Log
            </Text>
            <Button appearance="gray" size="sm" onPress={() => setLogEntries([])}>
              Clear
            </Button>
          </Box>
          <ScrollView style={styles.logEntries}>
            {logEntries.length === 0 ? (
              <Text typography="body3" lx={{ color: "muted" }}>
                Nothing logged yet.
              </Text>
            ) : (
              logEntries.map(entry => (
                <Text key={entry.id} typography="body3" lx={{ color: "base" }}>
                  {`${entry.time}  ${entry.event}${entry.details ? `  ${entry.details}` : ""}`}
                </Text>
              ))
            )}
          </ScrollView>
        </Box>
      </Box>
    </Box>
  );
}

function pad(value: number, length = 2): string {
  return String(value).padStart(length, "0");
}

function formatTime(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${pad(date.getMilliseconds(), 3)}`;
}

function formatConnectionResult(result: DeviceConnectionResult): string {
  const { connectedDevice } = result;
  return `${connectedDevice.name} (${connectedDevice.modelId}, ${connectedDevice.type}), session ${result.sessionId}`;
}

const cardStyle = {
  backgroundColor: "surface",
  borderRadius: "md",
  gap: "s12",
  padding: "s12",
  width: "full",
} as const;

const styles = StyleSheet.create({
  content: { flexGrow: 1, padding: 16, gap: 12 },
  fill: { flex: 1 },
  log: { maxHeight: 168 },
  logEntries: { flexShrink: 1 },
});
