import { type TimerDemoIntentDefinition } from "./types";
import { timerDemoIntentJob } from "./job";

export const timerDemoIntentDefinition: TimerDemoIntentDefinition = {
  label: "Timer",
  requiresConnectedDevice: true,
  delegateDeviceLockStateHandlingToExecutor: false,
  job: timerDemoIntentJob,
};
