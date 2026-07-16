import { type InitializationEchoIntentDefinition } from "./types";
import { initializationEchoIntentJob } from "./job";

export const initializationEchoIntentDefinition: InitializationEchoIntentDefinition = {
  label: "Initialization Echo",
  requiresConnectedDevice: true,
  delegateDeviceLockStateHandlingToExecutor: false,
  job: initializationEchoIntentJob,
};
