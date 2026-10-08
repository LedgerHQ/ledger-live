import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Box, Button, IconButton, Switch, Text, TextInput } from "@ledgerhq/lumen-ui-rnative";
import { Close } from "@ledgerhq/lumen-ui-rnative/symbols";
import type { DeviceConnectionResult } from "@ledgerhq/live-dmk-shared";
import {
  ConnectNewDevice,
  type ConnectNewDeviceDelays,
  type ConnectNewDeviceProps,
} from "LLM/components/ConnectNewDevice";

type LogEvent =
  | "mounted"
  | "unmounted"
  | "closed from navbar"
  | "onConnected"
  | "onDeviceNotFound"
  | "onClose";

type LogEntry = {
  id: number;
  time: string;
  event: LogEvent;
  details?: string;
};

const MAX_LOG_ENTRIES = 50;

/**
 * Mounts ConnectNewDevice the way a caller does: alone on the screen, and unmounted when a
 * callback ends the flow. The log keeps the callback calls and the mounts across runs.
 */
export default function DebugConnectNewDeviceScreen() {
  const navigation = useNavigation();
  const logIdRef = useRef(0);
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [deviceNotFoundDelay, setDeviceNotFoundDelay] = useState("");
  const [successDelay, setSuccessDelay] = useState("");
  const [delays, setDelays] = useState<ConnectNewDeviceDelays>({});
  const [withDeviceNotFound, setWithDeviceNotFound] = useState(true);

  const log = useCallback((event: LogEvent, details?: string) => {
    setLogEntries(entries =>
      [{ id: logIdRef.current++, time: formatTime(new Date()), event, details }, ...entries].slice(
        0,
        MAX_LOG_ENTRIES,
      ),
    );
  }, []);

  const onMount = useCallback(
    () => log("mounted", formatMountDetails(delays, withDeviceNotFound)),
    [delays, log, withDeviceNotFound],
  );
  const onUnmount = useCallback(() => log("unmounted"), [log]);

  // Each callback ends the flow for a caller, which then shows something else.
  const onConnected = useCallback(
    (result: DeviceConnectionResult) => {
      log("onConnected", formatConnectionResult(result));
      setIsMounted(false);
    },
    [log],
  );
  const onDeviceNotFound = useCallback(() => {
    log("onDeviceNotFound");
    setIsMounted(false);
  }, [log]);
  const onClose = useCallback(() => {
    log("onClose");
    setIsMounted(false);
  }, [log]);

  const closeFromNavbar = useCallback(() => {
    log("closed from navbar");
    setIsMounted(false);
  }, [log]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: isMounted
        ? () => (
            <IconButton
              appearance="no-background"
              size="md"
              icon={Close}
              accessibilityLabel="Unmount ConnectNewDevice"
              onPress={closeFromNavbar}
            />
          )
        : undefined,
    });
  }, [closeFromNavbar, isMounted, navigation]);

  const mount = () => {
    setDelays({
      deviceNotFound: parseDelay(deviceNotFoundDelay),
      success: parseDelay(successDelay),
    });
    setIsMounted(true);
  };

  if (isMounted) {
    return (
      <LoggedConnectNewDevice
        onMount={onMount}
        onUnmount={onUnmount}
        delays={delays}
        onConnected={onConnected}
        onDeviceNotFound={withDeviceNotFound ? onDeviceNotFound : undefined}
        onClose={onClose}
      />
    );
  }

  return (
    <View style={styles.container}>
      <Box lx={cardStyle}>
        <Box lx={{ flexDirection: "row", gap: "s8" }}>
          <View style={styles.delayInput}>
            <TextInput
              label="Not found delay (ms)"
              value={deviceNotFoundDelay}
              onChangeText={setDeviceNotFoundDelay}
              placeholder="Default"
              keyboardType="number-pad"
            />
          </View>
          <View style={styles.delayInput}>
            <TextInput
              label="Success delay (ms)"
              value={successDelay}
              onChangeText={setSuccessDelay}
              placeholder="Default"
              keyboardType="number-pad"
            />
          </View>
        </Box>
        <Box lx={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text typography="body2" lx={{ color: "base" }}>
            Pass onDeviceNotFound (onboarding)
          </Text>
          <Switch checked={withDeviceNotFound} onCheckedChange={setWithDeviceNotFound} />
        </Box>
        <Button appearance="base" size="lg" isFull onPress={mount}>
          Mount ConnectNewDevice
        </Button>
      </Box>

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

function LoggedConnectNewDevice({
  onMount,
  onUnmount,
  ...props
}: Readonly<ConnectNewDeviceProps & { onMount: () => void; onUnmount: () => void }>) {
  useEffect(() => {
    onMount();
    return onUnmount;
  }, [onMount, onUnmount]);

  return <ConnectNewDevice {...props} />;
}

function pad(value: number, length = 2): string {
  return String(value).padStart(length, "0");
}

function formatTime(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${pad(date.getMilliseconds(), 3)}`;
}

function parseDelay(text: string): number | undefined {
  const delay = Number(text);
  return text.trim() !== "" && Number.isFinite(delay) && delay >= 0 ? delay : undefined;
}

function formatMountDetails(
  { deviceNotFound, success }: ConnectNewDeviceDelays,
  withDeviceNotFound: boolean,
): string {
  const delays = `not found delay ${deviceNotFound ?? "default"}, success delay ${success ?? "default"}`;
  return `${delays}, ${withDeviceNotFound ? "with" : "without"} onDeviceNotFound`;
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
  delayInput: { flex: 1 },
});
