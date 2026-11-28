import { CreateBackupStateMachineLastAction } from "../types";

export const resumeTarget: Record<CreateBackupStateMachineLastAction, string> = {
  [CreateBackupStateMachineLastAction.CreateBackup]: "CreateBackup",
} as const;
