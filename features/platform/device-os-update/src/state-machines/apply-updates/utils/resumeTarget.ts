import { ApplyUpdatesStateMachineLastAction } from "../types";

export const resumeTarget: Record<ApplyUpdatesStateMachineLastAction, string> = {
  [ApplyUpdatesStateMachineLastAction.GetOsVersion]: "GetOsVersion",
  [ApplyUpdatesStateMachineLastAction.InstallOsu]: "InstallOsu",
  [ApplyUpdatesStateMachineLastAction.FlashMcu]: "FlashMcu",
  [ApplyUpdatesStateMachineLastAction.FlashMcuRecovery]: "FlashMcuRecovery",
  [ApplyUpdatesStateMachineLastAction.ResolveAfterOsu]: "ResolveAfterOsu",
  [ApplyUpdatesStateMachineLastAction.ResolveAfterFlash]: "ResolveAfterFlash",
  [ApplyUpdatesStateMachineLastAction.InstallFinalFirmware]: "InstallFinalFirmware",
  [ApplyUpdatesStateMachineLastAction.WaitForReadyAfterOsu]: "WaitForReadyAfterOsu",
  [ApplyUpdatesStateMachineLastAction.WaitForReadyAfterFlash]: "WaitForReadyAfterFlash",
  [ApplyUpdatesStateMachineLastAction.WaitForReadyAfterRecoveryFlash]:
    "WaitForReadyAfterRecoveryFlash",
  [ApplyUpdatesStateMachineLastAction.WaitForReadyAfterFinalInstall]:
    "WaitForReadyAfterFinalInstall",
} as const;
