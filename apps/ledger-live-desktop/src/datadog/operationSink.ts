import { datadogRum } from "@datadog/browser-rum";
import type { OperationFailureReason, OperationSink } from "@shared/observability-operations";
import { isDatadogRecording } from "./renderer";

const FAILURE_REASONS = {
  ERROR: "error",
  ABANDONED: "abandoned",
  OTHER: "other",
} as const satisfies Record<OperationFailureReason, string>;

export const datadogOperationSink: OperationSink = {
  isRecording: () => isDatadogRecording(),
  start: (name, operationKey, attributes) =>
    datadogRum.startFeatureOperation(name, { operationKey, context: attributes }),
  succeed: (name, operationKey, attributes) =>
    datadogRum.succeedFeatureOperation(name, { operationKey, context: attributes }),
  fail: (name, operationKey, reason, attributes) =>
    datadogRum.failFeatureOperation(name, FAILURE_REASONS[reason], {
      operationKey,
      context: attributes,
    }),
};
