import React, { useCallback, useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import {
  connectDeviceUseCase,
  ConnectDeviceUIStateTypes,
  type ConnectDeviceUIState,
  type ConnectDeviceUseCaseInput,
  type DisplayedDevice,
  useDeviceManagementKit,
} from "@ledgerhq/live-dmk-mobile";
import { Text, Flex, Button } from "@ledgerhq/native-ui";
import type { Subscription } from "rxjs";
import { useSelector } from "~/context/hooks";
import { knownDevicesSelector } from "~/reducers/knownDevices";
import { KnownDevice } from "@ledgerhq/live-dmk-shared";

type DeviceConnectionResult = Parameters<ConnectDeviceUseCaseInput["onConnected"]>[0];

type StateHistoryEntry = {
  id: number;
  timestamp: string;
  type: ConnectDeviceUIStateTypes;
  details: string;
};

type RunStatus = "idle" | "running" | "stopped";

export default function DebugConnectDeviceScreen() {
  const dmk = useDeviceManagementKit();
  const knownDevices = useSelector(knownDevicesSelector);
  const subscriptionRef = useRef<Subscription | null>(null);
  const historyIdRef = useRef(0);

  const [status, setStatus] = useState<RunStatus>("idle");
  const [currentState, setCurrentState] = useState<ConnectDeviceUIState | null>(null);
  const [stateHistory, setStateHistory] = useState<StateHistoryEntry[]>([]);
  const [lastError, setLastError] = useState<unknown>(null);
  const [connectionResult, setConnectionResult] = useState<DeviceConnectionResult | null>(null);

  const appendState = useCallback((state: ConnectDeviceUIState) => {
    setCurrentState(state);
    setStateHistory(history => [
      {
        id: historyIdRef.current++,
        timestamp: new Date().toLocaleTimeString(),
        type: state.type,
        details: formatStateDetails(state),
      },
      ...history.slice(0, 19),
    ]);
  }, []);

  const handleConnected = useCallback((result: DeviceConnectionResult) => {
    setConnectionResult(result);
  }, []);

  const stop = useCallback(() => {
    subscriptionRef.current?.unsubscribe();
    subscriptionRef.current = null;
    setStatus("stopped");
    setCurrentState(null);
    setStateHistory([]);
    setLastError(null);
    setConnectionResult(null);
  }, []);

  const start = useCallback(() => {
    if (!dmk || subscriptionRef.current) {
      return;
    }

    setStatus("running");
    setCurrentState(null);
    setStateHistory([]);
    setLastError(null);
    setConnectionResult(null);

    subscriptionRef.current = connectDeviceUseCase({
      knownDevices,
      dmk,
      onConnected: handleConnected,
    }).subscribe({
      next: appendState,
      error: error => {
        subscriptionRef.current = null;
        setLastError(error);
        setStatus("stopped");
      },
    });
  }, [appendState, dmk, handleConnected, knownDevices]);

  useEffect(() => stop, [stop]);

  const isRunning = status === "running";

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Flex p={3} backgroundColor="primary.c10" borderRadius={8} mb={4}>
        <Text variant="subtitle" mb={2}>
          Connect Device Playground
        </Text>
        <Text variant="small" color="neutral.c70">
          Exercises connectDeviceUseCase, the connect-device flow used by Device Intent Executor. It
          uses the persisted known devices from Redux, starts real DMK discovery, and exposes the
          callbacks emitted to the UI.
        </Text>
      </Flex>

      <Flex p={3} backgroundColor="neutral.c20" borderRadius={8} mb={4}>
        <Text variant="subtitle" mb={2}>
          Controls
        </Text>
        <StateRow label="DMK" value={dmk ? "ready" : "unavailable"} />
        <StateRow label="Runner" value={status} />
        <StateRow label="Known devices" value={String(knownDevices.length)} />
        <StateRow label="Current UI state" value={currentState?.type ?? "-"} />
        <StateRow label="Last error" value={formatUnknown(lastError)} />
        <Flex flexDirection="row" columnGap={12} mt={3}>
          <Button type="main" flex={1} onPress={start} disabled={!dmk || isRunning}>
            Start
          </Button>
          <Button type="error" flex={1} onPress={stop} disabled={!isRunning}>
            Stop
          </Button>
        </Flex>
      </Flex>

      <Flex p={3} backgroundColor="neutral.c20" borderRadius={8} mb={4}>
        <Text variant="subtitle" mb={2}>
          Known Devices
        </Text>
        {knownDevices.length === 0 ? (
          <Text variant="body" color="neutral.c70">
            No BLE known devices are stored. Starting the flow should emit no-known-device.
          </Text>
        ) : (
          knownDevices.map(device => <KnownDeviceCard key={device.id} device={device} />)
        )}
      </Flex>

      <Flex p={3} backgroundColor="neutral.c20" borderRadius={8} mb={4}>
        <Text variant="subtitle" mb={2}>
          Current UI State: {currentState?.type ?? "-"}
        </Text>
        {currentState ? (
          <>
            {renderConnectDeviceState(currentState)}
            <Text variant="small" color="neutral.c70" mt={3} mb={1}>
              Serializable state
            </Text>
            <Text variant="small" fontFamily="monospace" color="neutral.c70">
              {JSON.stringify(toSerializableState(currentState), null, 2)}
            </Text>
          </>
        ) : (
          <Text variant="body" color="neutral.c70">
            Start the playground to receive connect-device UI states.
          </Text>
        )}
      </Flex>

      {connectionResult ? (
        <Flex p={3} backgroundColor="success.c10" borderRadius={8} mb={4}>
          <Text variant="subtitle" mb={2}>
            Connection Result
          </Text>
          <Text variant="small" fontFamily="monospace" color="neutral.c70">
            {JSON.stringify(toSerializableConnectionResult(connectionResult), null, 2)}
          </Text>
        </Flex>
      ) : null}

      <Flex p={3} backgroundColor="neutral.c20" borderRadius={8}>
        <Text variant="subtitle" mb={2}>
          State History
        </Text>
        {stateHistory.length === 0 ? (
          <Text variant="body" color="neutral.c70">
            No state emitted yet.
          </Text>
        ) : (
          stateHistory.map(entry => <StateHistoryCard key={entry.id} entry={entry} />)
        )}
      </Flex>
    </ScrollView>
  );
}

function KnownDeviceCard({ device }: Readonly<{ device: KnownDevice }>) {
  return (
    <Flex p={3} backgroundColor="neutral.c30" borderRadius={8} mb={3}>
      <Text variant="body" fontWeight="semiBold" mb={2}>
        {device.name || "Unnamed device"}
      </Text>
      <StateRow label="ID" value={device.id} />
      <StateRow label="Model" value={String(device.deviceModelId)} />
      <StateRow label="Transport" value={device.transport} />
    </Flex>
  );
}

function DisplayedDeviceCard({ device }: Readonly<{ device: DisplayedDevice }>) {
  return (
    <Flex p={3} backgroundColor="neutral.c30" borderRadius={8} mb={3}>
      <Text variant="body" fontWeight="semiBold" mb={2}>
        {device.knownDevice.name || "Unnamed device"}
      </Text>
      <StateRow label="Availability" value={device.type} />
      <StateRow label="ID" value={device.knownDevice.id} />
      <StateRow label="Model" value={String(device.knownDevice.deviceModelId)} />
      <Button
        type={device.type === "available" ? "main" : "shade"}
        mt={3}
        onPress={device.onSelect}
      >
        Select
      </Button>
    </Flex>
  );
}

function StateHistoryCard({ entry }: Readonly<{ entry: StateHistoryEntry }>) {
  return (
    <Flex p={2} backgroundColor="neutral.c30" borderRadius={4} mb={2}>
      <StateRow label={entry.timestamp} value={entry.type} />
      <Text variant="small" color="neutral.c70">
        {entry.details}
      </Text>
    </Flex>
  );
}

function StateRow({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <Flex flexDirection="row" justifyContent="space-between" mb={1} columnGap={12}>
      <Text variant="small" color="neutral.c70" flexShrink={0}>
        {label}
      </Text>
      <Text variant="small" fontWeight="semiBold" flexShrink={1} textAlign="right">
        {value}
      </Text>
    </Flex>
  );
}

function renderConnectDeviceState(state: ConnectDeviceUIState): React.ReactNode {
  switch (state.type) {
    case ConnectDeviceUIStateTypes.Loading:
      return (
        <Text variant="body" color="neutral.c70">
          Loading connect-device state.
        </Text>
      );
    case ConnectDeviceUIStateTypes.NoKnownDevice:
      return (
        <Text variant="body" color="neutral.c70">
          The connect-device flow has no known device to match against discovery.
        </Text>
      );
    case ConnectDeviceUIStateTypes.Discovering:
      return state.devices.length > 0 ? (
        <>
          {state.devices.map(device => (
            <DisplayedDeviceCard key={device.knownDevice.id} device={device} />
          ))}
        </>
      ) : (
        <Text variant="body" color="neutral.c70">
          Discovering, but no known device is currently displayed.
        </Text>
      );
    case ConnectDeviceUIStateTypes.WaitingForSelectedDevice:
      return (
        <Flex p={3} backgroundColor="neutral.c30" borderRadius={8}>
          <Text variant="body" fontWeight="semiBold" mb={2}>
            Waiting for selected device
          </Text>
          <StateRow label="Name" value={state.device.name ?? "Discovered Device"} />
          <StateRow label="ID" value={state.device.id} />
          <StateRow label="Model" value={String(state.device.deviceModelId)} />
        </Flex>
      );
    case ConnectDeviceUIStateTypes.DiscoveryError:
      return (
        <Flex p={3} backgroundColor="error.c10" borderRadius={8}>
          <StateRow label="Type" value={state.error.type} />
          <StateRow label="Transport" value={state.error.transportId ?? "-"} />
          <StateRow label="Resolution" value={state.error.resolution?.type ?? "none"} />
          <Flex flexDirection="row" columnGap={12} mt={3}>
            {state.retry ? (
              <Button type="main" flex={1} onPress={state.retry}>
                Retry
              </Button>
            ) : null}
            <Button type="shade" flex={1} onPress={state.ignore}>
              Ignore
            </Button>
          </Flex>
        </Flex>
      );
    case ConnectDeviceUIStateTypes.Connecting:
      return (
        <Text variant="body" color="neutral.c70">
          Connecting to the selected matched device.
        </Text>
      );
    case ConnectDeviceUIStateTypes.ConnectionError:
      return (
        <Flex p={3} backgroundColor="error.c10" borderRadius={8}>
          <StateRow label="Type" value={state.error.type} />
          <Text variant="small" color="neutral.c70" mt={2}>
            {formatUnknown("error" in state.error ? state.error.error : null)}
          </Text>
          <Flex flexDirection="row" columnGap={12} mt={3}>
            <Button type="main" flex={1} onPress={state.retry}>
              Retry
            </Button>
            <Button type="shade" flex={1} onPress={state.ignore}>
              Ignore
            </Button>
          </Flex>
        </Flex>
      );
    case ConnectDeviceUIStateTypes.Connected:
      return (
        <Text variant="body" color="neutral.c70">
          Connected. The onConnected callback should have received the connection result.
        </Text>
      );
    default:
      return assertNever(state);
  }
}

function formatStateDetails(state: ConnectDeviceUIState): string {
  switch (state.type) {
    case ConnectDeviceUIStateTypes.Loading:
      return "Loading connect-device state.";
    case ConnectDeviceUIStateTypes.NoKnownDevice:
      return "No known device was provided.";
    case ConnectDeviceUIStateTypes.Discovering:
      return `${state.devices.length} displayed known device(s).`;
    case ConnectDeviceUIStateTypes.WaitingForSelectedDevice:
      return `Waiting for ${state.device.name}.`;
    case ConnectDeviceUIStateTypes.DiscoveryError:
      return `Discovery error: ${state.error.type}.`;
    case ConnectDeviceUIStateTypes.Connecting:
      return "Connecting to the selected device.";
    case ConnectDeviceUIStateTypes.ConnectionError:
      return `Connection error: ${state.error.type}.`;
    case ConnectDeviceUIStateTypes.Connected:
      return "Connected.";
    default:
      return assertNever(state);
  }
}

function toSerializableState(state: ConnectDeviceUIState): unknown {
  switch (state.type) {
    case ConnectDeviceUIStateTypes.Loading:
    case ConnectDeviceUIStateTypes.NoKnownDevice:
    case ConnectDeviceUIStateTypes.Connecting:
    case ConnectDeviceUIStateTypes.Connected:
      return state;
    case ConnectDeviceUIStateTypes.Discovering:
      return {
        type: state.type,
        devices: state.devices.map(device => ({
          type: device.type,
          knownDevice: device.knownDevice,
          onSelect: "[Function]",
        })),
      };
    case ConnectDeviceUIStateTypes.WaitingForSelectedDevice:
      return state;
    case ConnectDeviceUIStateTypes.DiscoveryError:
      return {
        type: state.type,
        error: {
          ...state.error,
          resolution: state.error.resolution
            ? {
                type: state.error.resolution.type,
                retry: state.error.resolution.type === "none" ? undefined : "[Function]",
              }
            : undefined,
        },
        retry: state.retry ? "[Function]" : undefined,
        ignore: "[Function]",
      };
    case ConnectDeviceUIStateTypes.ConnectionError:
      return {
        type: state.type,
        error: state.error,
        retry: "[Function]",
        ignore: "[Function]",
      };
    default:
      return assertNever(state);
  }
}

function toSerializableConnectionResult(result: DeviceConnectionResult): unknown {
  return {
    sessionId: result.sessionId,
    compatDeviceId: result.compatDeviceId,
    compatDeviceModelId: result.compatDeviceModelId,
    compatDeviceName: result.compatDeviceName,
    compatDeviceWired: result.compatDeviceWired,
    connectedDevice: {
      id: result.connectedDevice.id,
      modelId: result.connectedDevice.modelId,
      name: result.connectedDevice.name,
      type: result.connectedDevice.type,
    },
    dmk: "[DeviceManagementKit]",
  };
}

function formatUnknown(value: unknown): string {
  if (!value) {
    return "-";
  }

  if (value instanceof Error) {
    return value.message;
  }

  if (typeof value === "string") {
    return value;
  }

  try {
    return JSON.stringify(value);
  } catch {
    if (typeof value === "object") {
      return "[Unserializable object]";
    }

    return String(value);
  }
}

function assertNever(value: never): never {
  throw new Error(`Unhandled connect device state: ${JSON.stringify(value)}`);
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
});
