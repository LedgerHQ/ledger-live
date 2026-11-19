import { DdRum, FeatureOperationFailure } from "@datadog/mobile-react-native";
import type { OperationSink } from "@shared/observability-operations";
import { isDatadogRecording } from "./datadog";

/** A rejected or throwing bridge call must not surface: telemetry never breaks a flow. */
const send = (call: () => Promise<void>): void => {
  try {
    call().catch(() => {});
  } catch {
    // The SDK threw synchronously: drop the event.
  }
};

/**
 * Sends the operations of `@shared/observability-operations` as Datadog RUM feature operations.
 * Starts are gated on `isDatadogRecording`: the `llmDatadog` flag and the tracking consent.
 */
export const datadogOperationSink: OperationSink = {
  isRecording: () => isDatadogRecording(),
  start: (name, operationKey, attributes) =>
    send(() => DdRum.startFeatureOperation(name, operationKey ?? null, attributes)),
  succeed: (name, operationKey, attributes) =>
    send(() => DdRum.succeedFeatureOperation(name, operationKey ?? null, attributes)),
  fail: (name, operationKey, reason, attributes) =>
    send(() =>
      DdRum.failFeatureOperation(
        name,
        operationKey ?? null,
        // Read at call time: a test mocking the SDK partially must not break this module's load.
        FeatureOperationFailure[reason],
        attributes,
      ),
    ),
};
