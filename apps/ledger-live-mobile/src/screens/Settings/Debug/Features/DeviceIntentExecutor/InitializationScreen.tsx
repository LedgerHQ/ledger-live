import React, { useCallback, useMemo, useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import {
  createIntent,
  type DeviceConnectionParams,
  type ExecutorState,
} from "@ledgerhq/device-intent";
import { Text, Flex, Button, SelectableList } from "@ledgerhq/native-ui";
import { BottomSheetHeader, BottomSheetScrollView } from "@ledgerhq/lumen-ui-rnative";
import QueuedDrawerBottomSheet from "LLM/components/QueuedDrawer/QueuedDrawerBottomSheet";
import { DeviceIntentExecutorLWM } from "LLM/components/DeviceIntentExecutor";
import { initializationEchoIntentLWMDefinition } from "./intents/initializationEchoIntent/intentLWMDefinition";
import type { InitializationEchoIntentJobState } from "./intents/initializationEchoIntent/types";
import { INITIALIZATION_SCENARIOS } from "./initializationScenarios";

const SCENARIO_PICKER_SNAP_POINTS = ["90%"];

const DEFAULT_CONNECTION_PARAMS: DeviceConnectionParams = {
  acceptedDeviceModelIds: [],
};

const intent = createIntent(initializationEchoIntentLWMDefinition);

export default function DebugDeviceIntentExecutorInitialization() {
  const [selectedScenarioId, setSelectedScenarioId] = useState(INITIALIZATION_SCENARIOS[0].id);
  const [enabled, setEnabled] = useState(false);
  const [executorState, setExecutorState] = useState<ExecutorState | null>(null);
  const [latestJobState, setLatestJobState] = useState<InitializationEchoIntentJobState | null>(
    null,
  );
  const [jobCompleted, setJobCompleted] = useState(false);
  const [jobError, setJobError] = useState<unknown>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const selectedScenario =
    INITIALIZATION_SCENARIOS.find(scenario => scenario.id === selectedScenarioId) ??
    INITIALIZATION_SCENARIOS[0];

  const openPicker = useCallback(() => {
    if (enabled) return;
    setIsPickerOpen(true);
  }, [enabled]);

  const closePicker = useCallback(() => {
    setIsPickerOpen(false);
  }, []);

  const selectScenario = useCallback(
    (scenarioId: string) => {
      if (enabled) return;
      setSelectedScenarioId(scenarioId);
      setExecutorState(null);
      setLatestJobState(null);
      setJobCompleted(false);
      setJobError(null);
      setIsPickerOpen(false);
    },
    [enabled],
  );

  const start = useCallback(() => {
    setExecutorState(null);
    setLatestJobState(null);
    setJobCompleted(false);
    setJobError(null);
    setEnabled(true);
  }, []);

  const stop = useCallback(() => {
    setEnabled(false);
    setExecutorState(null);
  }, []);

  const handleUserCancel = useCallback(() => {
    setEnabled(false);
    setExecutorState(null);
  }, []);

  const executorProps = useMemo(
    () => ({
      enabled: true,
      deviceConnectionParams: DEFAULT_CONNECTION_PARAMS,
      deviceInitializationInput: selectedScenario.input,
      initializerConfig: selectedScenario.initializerConfig,
      intent,
      intentComponentExtraProps: {},
      onExecutorStateChanged: setExecutorState,
      onIntentJobStateChanged: setLatestJobState,
      onIntentJobComplete: () => {
        setJobCompleted(true);
      },
      onIntentJobError: (error: unknown) => {
        setJobError(error);
      },
      cancellableUI: true,
      cancelIntentRequestId: undefined,
      onUserCancel: handleUserCancel,
    }),
    [handleUserCancel, selectedScenario],
  );

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Flex p={3} backgroundColor="primary.c10" borderRadius={8} mb={4}>
          <Text variant="subtitle" mb={2}>
            DIE Initialization Playground
          </Text>
          <Text variant="small" color="neutral.c70" mb={2}>
            This playground runs the real Device Intent Executor initializer (connect → open app →
            optional derivation → optional deprecation checks), and then runs a single
            &quot;echo&quot; intent that simply prints the device context the job received once
            initialization succeeded.
          </Text>
          <Text variant="small" color="neutral.c70">
            Each scenario defines two things: an <Text fontWeight="semiBold">input</Text> (which app
            to open, derivation path, deprecation flow, expected account…) and optionally an{" "}
            <Text fontWeight="semiBold">injected initializer configuration</Text> (e.g. a forced
            minimum app version, or a custom device deprecation config) used to exercise edge cases
            without touching the real backend.
          </Text>
        </Flex>

        <Flex p={3} backgroundColor="neutral.c20" borderRadius={8} mb={4}>
          <Flex
            flexDirection="row"
            justifyContent="space-between"
            alignItems="center"
            mb={2}
            columnGap={3}
          >
            <Text variant="subtitle" flexShrink={1}>
              Selected Scenario
            </Text>
            <Button type="shade" size="small" onPress={openPicker} disabled={enabled}>
              Change
            </Button>
          </Flex>
          <Text variant="body" mb={1}>
            {selectedScenario.title}
          </Text>
          <Text variant="small" color="neutral.c70" mb={2}>
            {selectedScenario.description}
          </Text>
          <SummaryBox label="Input" value={selectedScenario.inputSummary} />
          <SummaryBox
            label="Initializer config"
            value={selectedScenario.initializerConfigSummary}
            mt={2}
          />
          <Flex mt={3}>
            <StateRow label="Executor" value={executorState?.type ?? "-"} />
            <StateRow label="Job completed" value={jobCompleted ? "YES" : "no"} />
            <StateRow label="Job error" value={formatError(jobError)} />
          </Flex>
          <Text variant="small" color="neutral.c70" mt={3} mb={1}>
            Raw initialization input
          </Text>
          <Text variant="small" fontFamily="monospace" color="neutral.c70">
            {JSON.stringify(selectedScenario.input, null, 2)}
          </Text>
        </Flex>

        {latestJobState ? (
          <Flex p={3} backgroundColor="neutral.c20" borderRadius={8} mb={4}>
            <Text variant="subtitle" mb={2}>
              Latest Echo Job State
            </Text>
            <Text variant="small" fontFamily="monospace" color="neutral.c70">
              {JSON.stringify(latestJobState, null, 2)}
            </Text>
          </Flex>
        ) : null}

        <Button type={enabled ? "error" : "main"} mb={4} onPress={enabled ? stop : start}>
          {enabled ? "Stop Initialization" : "Start Initialization"}
        </Button>

        {enabled ? <DeviceIntentExecutorLWM sourceFlow="debug" {...executorProps} /> : null}
      </ScrollView>

      <QueuedDrawerBottomSheet
        isRequestingToBeOpened={isPickerOpen}
        onClose={closePicker}
        snapPoints={SCENARIO_PICKER_SNAP_POINTS}
        enablePanDownToClose
      >
        <BottomSheetHeader title="Choose a scenario" spacing density="expanded" />
        <BottomSheetScrollView contentContainerStyle={styles.pickerContent}>
          <SelectableList currentValue={selectedScenario.id} onChange={selectScenario}>
            {INITIALIZATION_SCENARIOS.map(scenario => (
              <SelectableList.Element key={scenario.id} value={scenario.id} disabled={enabled}>
                <Flex flex={1}>
                  <Text variant="body" fontWeight="semiBold" mb={1}>
                    {scenario.title}
                  </Text>
                  <Text variant="small" color="neutral.c70" mb={2}>
                    {scenario.description}
                  </Text>
                  <SummaryBox label="Input" value={scenario.inputSummary} />
                  <SummaryBox
                    label="Initializer config"
                    value={scenario.initializerConfigSummary}
                    mt={2}
                  />
                </Flex>
              </SelectableList.Element>
            ))}
          </SelectableList>
        </BottomSheetScrollView>
      </QueuedDrawerBottomSheet>
    </>
  );
}

function StateRow({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <Flex flexDirection="row" justifyContent="space-between" mb={1}>
      <Text variant="small" color="neutral.c70">
        {label}
      </Text>
      <Text variant="small" fontWeight="semiBold" flexShrink={1} textAlign="right">
        {value}
      </Text>
    </Flex>
  );
}

function SummaryBox({ label, value, mt }: Readonly<{ label: string; value: string; mt?: number }>) {
  return (
    <Flex p={2} backgroundColor="neutral.c30" borderRadius={4} mt={mt}>
      <Text variant="tiny" color="neutral.c80" mb={1} fontWeight="semiBold">
        {label}
      </Text>
      <Text variant="small" color="neutral.c100">
        {value}
      </Text>
    </Flex>
  );
}

function formatError(error: unknown): string {
  if (!error) return "-";
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error) ?? "Unknown error";
  } catch {
    return "Unknown error";
  }
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  pickerContent: { paddingBottom: 24 },
});
