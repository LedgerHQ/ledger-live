import { DdRum, FeatureOperationFailure } from "@datadog/mobile-react-native";
import type { OperationSink } from "@shared/observability-operations";
import { isDatadogRecording } from "./datadog";

/**
 * A rejected bridge call must not surface as an unhandled rejection: telemetry never breaks a
 * flow. A synchronous throw needs no handling here, the tracker calls every sink in a try/catch.
 */
const ignoreRejection = (call: Promise<void>): void => {
  call.catch(() => {});
};

/**
 * Sends the operations of `@shared/observability-operations` as Datadog RUM feature operations.
 * Starts are gated on `isDatadogRecording`: the `llmDatadog` flag and the tracking consent.
 */
export const datadogOperationSink: OperationSink = {
  isRecording: () => isDatadogRecording(),
  start: (name, operationKey, attributes) =>
    ignoreRejection(DdRum.startFeatureOperation(name, operationKey ?? null, attributes)),
  succeed: (name, operationKey, attributes) =>
    ignoreRejection(DdRum.succeedFeatureOperation(name, operationKey ?? null, attributes)),
  fail: (name, operationKey, reason, attributes) =>
    ignoreRejection(
      DdRum.failFeatureOperation(
        name,
        operationKey ?? null,
        // Read at call time: a test mocking the SDK partially must not break this module's load.
        FeatureOperationFailure[reason],
        attributes,
      ),
    ),
};
