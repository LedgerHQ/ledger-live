import React, { useCallback, useRef, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
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
 * Shows ConnectKnownOrNewDevice the way My Wallet does: it stays on screen, and the rest of the
 * screen hides during the Add mode. The log keeps the callback calls.
 */
export default function DebugConnectKnownOrNewDeviceScreen() {
  const logIdRef = useRef(0);
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const log = useCallback((event: LogEvent, details?: string) => {
    setLogEntries(entries =>
      [{ id: logIdRef.current++, time: formatTime(new Date()), event, details }, ...entries].slice(
        0,
        MAX_LOG_ENTRIES,
      ),
    );
  }, []);

  const onConnected = useCallback(
    (result: DeviceConnectionResult, { isNewDevice }: { isNewDevice: boolean }) =>
      log("onConnected", `${formatConnectionResult(result)}, isNewDevice ${isNewDevice}`),
    [log],
  );
  const onAddModeChange = useCallback(
    (adding: boolean) => {
      log("onAddModeChange", `isAdding ${adding}`);
      setIsAdding(adding);
    },
    [log],
  );
  const onDeviceNotFound = useCallback(() => log("onDeviceNotFound"), [log]);

  const component = (
    <ConnectKnownOrNewDevice
      onConnected={onConnected}
      onAddModeChange={onAddModeChange}
      isPaused={isPaused}
      onDeviceNotFound={onDeviceNotFound}
    />
  );

  return (
    <View style={styles.container}>
      {!isAdding && (
        <Box lx={cardStyle}>
          <Box lx={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text typography="body2" lx={{ color: "base" }}>
              isPaused
            </Text>
            <Switch checked={isPaused} onCheckedChange={setIsPaused} />
          </Box>
        </Box>
      )}

      {isAdding ? (
        <View style={styles.component}>{component}</View>
      ) : (
        <ScrollView style={styles.component}>{component}</ScrollView>
      )}

      <Box lx={{ ...cardStyle, flex: 1 }}>
        <Box lx={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text typography="body2SemiBold" lx={{ color: "base" }}>
            Log
          </Text>
          <Button appearance="gray" size="sm" onPress={() => setLogEntries([])}>
            Clear
          </Button>
        </Box>
        <ScrollView>
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
    </View>
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
  container: { flex: 1, padding: 16, gap: 12 },
  component: { flex: 2 },
});
