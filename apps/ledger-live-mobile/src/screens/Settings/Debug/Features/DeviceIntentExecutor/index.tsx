import React, { useCallback, useMemo, useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { Text, Flex, Button } from "@ledgerhq/native-ui";
import { DeviceIntentExecutorLWM } from "LLM/components/device-intent-executor";
import { DEMO_INTENT_DEFS } from "./intents/registry";
import type { DemoIntentDefinitions } from "./intents/orchestrationTypes";
import { useDemoIntentOrchestration } from "./useDemoIntentOrchestration";

export default function DebugDeviceIntentExecutor() {
  const [tickCount, setTickCount] = useState(5);

  const intentDefs = useMemo<DemoIntentDefinitions>(() => DEMO_INTENT_DEFS, []);

  const orchestration = useDemoIntentOrchestration({
    tickCount,
    intentDefs,
  });

  const { enabled, toggleEnabled } = orchestration;

  const decrementTicks = useCallback(() => {
    if (!enabled) setTickCount(prev => Math.max(1, prev - 1));
  }, [enabled]);

  const incrementTicks = useCallback(() => {
    if (!enabled) setTickCount(prev => prev + 1);
  }, [enabled]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* --- Hint --- */}
      <Flex p={3} backgroundColor="primary.c10" borderRadius={8} mb={4}>
        <Text variant="subtitle" mb={2}>
          Device Intent Executor Playground
        </Text>
        <Text variant="small" color="neutral.c70">
          Exercises the DeviceIntentExecutor lifecycle with a sequence of demo intents. Each intent
          demonstrates a different integration pattern: simple observable job, legacy withDevice
          bridge, DMK signer device action, and interactive user prompt with a DMK device action.
        </Text>
        <Text variant="small" color="neutral.c70" mt={2}>
          Tap "Start Orchestration" to connect a device and run the full sequence.
        </Text>
      </Flex>

      {/* --- State display --- */}
      <Flex p={3} backgroundColor="neutral.c20" borderRadius={8} mb={4}>
        <Text variant="subtitle" mb={2}>
          Orchestration State
        </Text>
        <StateRow label="Phase" value={orchestration.demoPhase.phase} />
        <StateRow label="Executor" value={orchestration.executorState?.type ?? "—"} />
        <StateRow
          label="Job state"
          value={orchestration.latestJobState ? JSON.stringify(orchestration.latestJobState) : "—"}
        />
        <StateRow label="Job completed" value={orchestration.jobCompleted ? "YES" : "no"} />
        <StateRow
          label="Job error"
          value={
            orchestration.jobError
              ? orchestration.jobError instanceof Error
                ? orchestration.jobError.message
                : String(orchestration.jobError)
              : "—"
          }
        />
      </Flex>

      {/* --- Configuration --- */}
      <Flex mb={4} p={3} backgroundColor="neutral.c20" borderRadius={8}>
        <Text variant="subtitle" mb={2}>
          Configuration
        </Text>
        <Flex flexDirection="row" alignItems="center" justifyContent="space-between" mb={3}>
          <Text variant="body">Timer tick count</Text>
          <Flex flexDirection="row" alignItems="center" columnGap={12}>
            <Button size="small" type="shade" onPress={decrementTicks} disabled={enabled}>
              –
            </Button>
            <Text variant="body" fontWeight="semiBold">
              {tickCount}
            </Text>
            <Button size="small" type="shade" onPress={incrementTicks} disabled={enabled}>
              +
            </Button>
          </Flex>
        </Flex>
      </Flex>

      {/* --- CTA --- */}
      <Button type={enabled ? "error" : "main"} mb={4} onPress={toggleEnabled}>
        {enabled ? "Stop Orchestration" : "Start Orchestration"}
      </Button>

      {/* --- Executor --- */}
      {orchestration.enabled && <DeviceIntentExecutorLWM {...orchestration.executorProps} />}
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

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
});
