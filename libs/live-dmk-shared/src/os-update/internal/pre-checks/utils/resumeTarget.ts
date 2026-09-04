import { PreChecksStateMachineLastAction } from "../types";

export const resumeTarget: Record<PreChecksStateMachineLastAction, string> = {
  [PreChecksStateMachineLastAction.WaitForAppAndVersion]: "WaitingForAppAndVersion",
  [PreChecksStateMachineLastAction.GetBatteryStatus]: "GetBatteryStatus",
} as const;
