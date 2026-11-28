import type { CreateBackupState } from "../../../types/CreateBackupState";

export const isSameState = (previous: CreateBackupState, next: CreateBackupState): boolean =>
  previous.type === next.type;
