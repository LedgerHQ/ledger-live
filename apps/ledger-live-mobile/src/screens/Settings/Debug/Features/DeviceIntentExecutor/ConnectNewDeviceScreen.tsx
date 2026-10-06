import React, { useCallback, useRef, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Box, Button, Text, TextInput } from "@ledgerhq/lumen-ui-rnative";
import type { DeviceConnectionResult } from "@ledgerhq/live-dmk-shared";
import { ConnectNewDevice, type ConnectNewDeviceDelays } from "LLM/components/ConnectNewDevice";

type CallbackName = "onConnected" | "onDeviceNotFound" | "onClose";

type CallbackLogEntry = {
  id: number;
  time: string;
  callback: CallbackName;
  details?: string;
};

const MAX_LOG_ENTRIES = 20;

export default function DebugConnectNewDeviceScreen() {
  const logIdRef = useRef(0);
  const [logEntries, setLogEntries] = useState<CallbackLogEntry[]>([]);
  const [runId, setRunId] = useState(0);
  const [deviceNotFoundDelay, setDeviceNotFoundDelay] = useState("");
  const [successDelay, setSuccessDelay] = useState("");
  const [delays, setDelays] = useState<ConnectNewDeviceDelays>({});

  const logCall = useCallback((callback: CallbackName, details?: string) => {
    setLogEntries(entries =>
      [
        { id: logIdRef.current++, time: new Date().toLocaleTimeString(), callback, details },
        ...entries,
      ].slice(0, MAX_LOG_ENTRIES),
    );
  }, []);

  const onConnected = useCallback(
    (result: DeviceConnectionResult) => logCall("onConnected", formatConnectionResult(result)),
    [logCall],
  );
  const onDeviceNotFound = useCallback(() => logCall("onDeviceNotFound"), [logCall]);
  const onClose = useCallback(() => logCall("onClose"), [logCall]);

  // The component reads the delays on mount: a new key restarts the flow with them.
  const restart = () => {
    setDelays({
      deviceNotFound: parseDelay(deviceNotFoundDelay),
      success: parseDelay(successDelay),
    });
    setRunId(id => id + 1);
  };

  return (
    <View style={styles.container}>
      <Box lx={cardStyle}>
        <Box lx={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text typography="body2SemiBold" lx={{ color: "base" }}>
            Callback calls
          </Text>
          <Button appearance="gray" size="sm" onPress={() => setLogEntries([])}>
            Clear
          </Button>
        </Box>
        <ScrollView style={styles.log} testID="connect-new-device-debug-log">
          {logEntries.length === 0 ? (
            <Text typography="body3" lx={{ color: "muted" }}>
              No callback called yet.
            </Text>
          ) : (
            logEntries.map(entry => (
              <Text key={entry.id} typography="body3" lx={{ color: "base" }}>
                {`${entry.time}  ${entry.callback}${entry.details ? `  ${entry.details}` : ""}`}
              </Text>
            ))
          )}
        </ScrollView>
      </Box>

      <Box lx={{ ...cardStyle, flexDirection: "row", alignItems: "flex-end" }}>
        <View style={styles.delayInput}>
          <TextInput
            label="Not found delay (ms)"
            value={deviceNotFoundDelay}
            onChangeText={setDeviceNotFoundDelay}
            placeholder="Default"
            keyboardType="number-pad"
            testID="connect-new-device-debug-not-found-delay"
          />
        </View>
        <View style={styles.delayInput}>
          <TextInput
            label="Success delay (ms)"
            value={successDelay}
            onChangeText={setSuccessDelay}
            placeholder="Default"
            keyboardType="number-pad"
            testID="connect-new-device-debug-success-delay"
          />
        </View>
        <Button appearance="base" size="md" onPress={restart}>
          Restart
        </Button>
      </Box>

      <View style={styles.component}>
        <ConnectNewDevice
          key={runId}
          delays={delays}
          onConnected={onConnected}
          onDeviceNotFound={onDeviceNotFound}
          onClose={onClose}
        />
      </View>
    </View>
  );
}

function parseDelay(text: string): number | undefined {
  const delay = Number(text);
  return text.trim() !== "" && Number.isFinite(delay) && delay >= 0 ? delay : undefined;
}

function formatConnectionResult(result: DeviceConnectionResult): string {
  const { connectedDevice } = result;
  return `${connectedDevice.name} (${connectedDevice.modelId}, ${connectedDevice.type}), session ${result.sessionId}`;
}

const cardStyle = {
  backgroundColor: "surface",
  borderRadius: "md",
  gap: "s8",
  padding: "s12",
  width: "full",
} as const;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  log: { maxHeight: 120 },
  delayInput: { flex: 1 },
  component: { flex: 1 },
});
