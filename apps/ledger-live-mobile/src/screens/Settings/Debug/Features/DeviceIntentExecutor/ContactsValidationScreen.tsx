import React, { useCallback, useMemo, useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import {
  createIntent,
  type DeviceConnectionParams,
  type ExecutorState,
} from "@features/platform-device-intent";
import type {
  RegisterExternalAddressIntentInput,
  RegisterExternalAddressJobState,
} from "@features/platform-contacts/device/intents";
import { registerExternalAddressIntentLWMDefinition } from "LLM/features/Contacts/deviceIntents/registerExternalAddressIntent/intentLWMDefinition";
import { Text, Flex, Button } from "@ledgerhq/native-ui";
import { DeviceIntentExecutorLWM } from "LLM/components/DeviceIntentExecutor";

const DEFAULT_CONNECTION_PARAMS: DeviceConnectionParams = {
  acceptedDeviceModelIds: [],
};

const CONTACTS_VALIDATION_INPUT: RegisterExternalAddressIntentInput = {
  contactName: "DIE validation",
  scope: "Ethereum",
  address: "0x1111111111111111111111111111111111111111",
  blockchainFamily: "evm",
  chainId: 1,
};

const contactsValidationIntent = createIntent(
  registerExternalAddressIntentLWMDefinition,
  CONTACTS_VALIDATION_INPUT,
);

export default function DebugDeviceIntentExecutorContactsValidation() {
  const [enabled, setEnabled] = useState(false);
  const [executorState, setExecutorState] = useState<ExecutorState | null>(null);
  const [latestJobState, setLatestJobState] = useState<RegisterExternalAddressJobState | null>(
    null,
  );
  const [jobCompleted, setJobCompleted] = useState(false);
  const [jobError, setJobError] = useState<unknown>(null);

  const resetRunState = useCallback(() => {
    setExecutorState(null);
    setLatestJobState(null);
    setJobCompleted(false);
    setJobError(null);
  }, []);

  const handleUserCancel = useCallback(() => {
    setEnabled(false);
    setExecutorState(null);
  }, []);

  const executorProps = useMemo(
    () => ({
      enabled: true,
      deviceConnectionParams: DEFAULT_CONNECTION_PARAMS,
      deviceInitializationInput: {
        appName: "BOLOS",
        dependencies: [],
        requireLatestFirmware: false,
      },
      intent: contactsValidationIntent,
      intentComponentExtraProps: undefined,
      onExecutorStateChanged: setExecutorState,
      onIntentJobStateChanged: setLatestJobState,
      onIntentJobComplete: () => {
        setJobCompleted(true);
      },
      onIntentJobError: (error: unknown) => {
        setJobError(error);
      },
      cancelIntentRequestId: undefined,
      onUserCancel: handleUserCancel,
    }),
    [handleUserCancel],
  );

  const start = useCallback(() => {
    resetRunState();
    setEnabled(true);
  }, [resetRunState]);

  const stop = useCallback(() => {
    setEnabled(false);
    setExecutorState(null);
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Flex p={3} backgroundColor="primary.c10" borderRadius={8} mb={4}>
        <Text variant="subtitle" mb={2}>
          Contacts DIE Validation
        </Text>
        <Text variant="small" color="neutral.c70">
          Runs the Contacts register-external-address intent with deterministic development input.
        </Text>
      </Flex>

      <Flex p={3} backgroundColor="neutral.c20" borderRadius={8} mb={4}>
        <Text variant="subtitle" mb={2}>
          Intent state
        </Text>
        <StateRow label="Executor" value={executorState?.type ?? "-"} />
        <StateRow label="Job state" value={latestJobState ? JSON.stringify(latestJobState) : "-"} />
        <StateRow label="Job completed" value={jobCompleted ? "YES" : "no"} />
        <StateRow label="Job error" value={formatError(jobError)} />
      </Flex>

      <Flex p={3} backgroundColor="neutral.c20" borderRadius={8} mb={4}>
        <Text variant="subtitle" mb={2}>
          Intent input
        </Text>
        <Text variant="small" fontFamily="monospace" color="neutral.c70">
          {JSON.stringify(CONTACTS_VALIDATION_INPUT, null, 2)}
        </Text>
      </Flex>

      <Button type={enabled ? "error" : "main"} mb={4} onPress={enabled ? stop : start}>
        {enabled ? "Stop Contacts validation" : "Start Contacts validation"}
      </Button>

      {enabled ? <DeviceIntentExecutorLWM sourceFlow="debug" {...executorProps} /> : null}
    </ScrollView>
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
});
