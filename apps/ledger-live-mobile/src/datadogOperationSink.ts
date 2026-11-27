import { DdRum, FeatureOperationFailure } from "@datadog/mobile-react-native";
import type { OperationSink } from "@shared/observability-operations";
import { isDatadogRecording } from "./datadog";

const ignoreRejection = (call: Promise<void>): void => {
  call.catch(() => {});
};

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
        FeatureOperationFailure[reason],
        attributes,
      ),
    ),
};
