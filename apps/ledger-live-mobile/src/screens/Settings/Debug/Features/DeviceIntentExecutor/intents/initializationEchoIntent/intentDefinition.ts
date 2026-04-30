import { initializationEchoIntentJob } from "./job";
import type { InitializationEchoIntentDefinition } from "./types";

export const initializationEchoIntentDefinition: InitializationEchoIntentDefinition = {
  label: "Initialization Echo",
  requiresConnectedDevice: true,
  delegateDeviceLockStateHandlingToExecutor: false,
  job: initializationEchoIntentJob,
};
