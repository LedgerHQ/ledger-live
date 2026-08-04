import { signMessageIntentJob } from "./job";
import type { SignMessageIntentDefinition } from "./types";

export const signMessageIntentDefinition: SignMessageIntentDefinition = {
  label: "Sign message",
  requiresConnectedDevice: true,
  delegateDeviceLockStateHandlingToExecutor: false,
  job: signMessageIntentJob,
};
