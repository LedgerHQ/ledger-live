import { PreChecksStateMachineLastAction } from "../types";

export const resumeTarget: Record<PreChecksStateMachineLastAction, string> = {
  [PreChecksStateMachineLastAction.GetOsVersion]: "GetOsVersion",
  [PreChecksStateMachineLastAction.GetBatteryStatus]: "GetBatteryStatus",
} as const;
