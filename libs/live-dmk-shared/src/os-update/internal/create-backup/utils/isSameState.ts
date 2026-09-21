import type { CreateBackupState } from "../../../api/model/CreateBackupState";

export const isSameState = (previous: CreateBackupState, next: CreateBackupState): boolean =>
  previous.type === next.type;
