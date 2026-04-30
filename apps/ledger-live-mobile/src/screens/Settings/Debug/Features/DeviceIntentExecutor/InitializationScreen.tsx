import React, { useCallback, useMemo, useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import {
  createIntent,
  type DeviceConnectionParams,
  type ExecutorState,
} from "@ledgerhq/device-intent";
import { Text, Flex, Button, SelectableList } from "@ledgerhq/native-ui";
import { DeviceIntentExecutorLWM } from "LLM/components/DeviceIntentExecutor";
import { initializationEchoIntentLWMDefinition } from "./intents/initializationEchoIntent/intentLWMDefinition";
import type { InitializationEchoIntentJobState } from "./intents/initializationEchoIntent/types";
import { INITIALIZATION_SCENARIOS } from "./initializationScenarios";

const DEFAULT_CONNECTION_PARAMS: DeviceConnectionParams = {
  acceptedDeviceModelIds: [],
};

export default function DebugDeviceIntentExecutorInitialization() {
  const [selectedScenarioId, setSelectedScenarioId] = useState(INITIALIZATION_SCENARIOS[0].id);
  const [enabled, setEnabled] = useState(false);
  const [runId, setRunId] = useState(0);
  const [executorState, setExecutorState] = useState<ExecutorState | null>(null);
  const [latestJobState, setLatestJobState] = useState<InitializationEchoIntentJobState | null>(
    null,
  );
  const [jobCompleted, setJobCompleted] = useState(false);
  const [jobError, setJobError] = useState<unknown>(null);

  const selectedScenario =
    INITIALIZATION_SCENARIOS.find(scenario => scenario.id === selectedScenarioId) ??
    INITIALIZATION_SCENARIOS[0];

  const intent = useMemo(() => createIntent(initializationEchoIntentLWMDefinition), [runId]);

  const selectScenario = useCallback(
    (scenarioId: string) => {
      if (enabled) return;
      setSelectedScenarioId(scenarioId);
      setExecutorState(null);
      setLatestJobState(null);
      setJobCompleted(false);
      setJobError(null);
    },
    [enabled],
  );

  const start = useCallback(() => {
    setRunId(prev => prev + 1);
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
    [handleUserCancel, intent, selectedScenario],
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Flex p={3} backgroundColor="primary.c10" borderRadius={8} mb={4}>
        <Text variant="subtitle" mb={2}>
          DIE Initialization Playground
        </Text>
        <Text variant="small" color="neutral.c70">
          Runs the real initializer and then a single echo intent that prints the extracted device
          context received by the job.
        </Text>
      </Flex>

      <Flex mb={4}>
        <Text variant="subtitle" mb={2}>
          Scenarios
        </Text>
        <SelectableList currentValue={selectedScenario.id} onChange={selectScenario}>
          {INITIALIZATION_SCENARIOS.map(scenario => (
            <SelectableList.Element key={scenario.id} value={scenario.id} disabled={enabled}>
              <Flex>
                <Text variant="body" fontWeight="semiBold" mb={1}>
                  {scenario.title}
                </Text>
                <Text variant="small" color="neutral.c70">
                  {scenario.description}
                </Text>
              </Flex>
            </SelectableList.Element>
          ))}
        </SelectableList>
      </Flex>

      <Flex p={3} backgroundColor="neutral.c20" borderRadius={8} mb={4}>
        <Text variant="subtitle" mb={2}>
          Selected Scenario
        </Text>
        <Text variant="body" mb={1}>
          {selectedScenario.title}
        </Text>
        <Text variant="small" color="neutral.c70" mb={3}>
          {selectedScenario.description}
        </Text>
        <StateRow label="Executor" value={executorState?.type ?? "-"} />
        <StateRow label="Job completed" value={jobCompleted ? "YES" : "no"} />
        <StateRow label="Job error" value={formatError(jobError)} />
        <Text variant="small" color="neutral.c70" mt={3} mb={1}>
          Initializer config
        </Text>
        <Text variant="small" fontFamily="monospace" color="neutral.c70" mb={3}>
          {selectedScenario.initializerConfigSummary}
        </Text>
        <Text variant="small" color="neutral.c70" mb={1}>
          Initialization input
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

      {enabled ? <DeviceIntentExecutorLWM {...executorProps} /> : null}
    </ScrollView>
  );
}

function StateRow({ label, value }: { label: string; value: string }) {
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

function formatError(error: unknown): string {
  if (!error) return "-";
  return error instanceof Error ? error.message : String(error);
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
});
