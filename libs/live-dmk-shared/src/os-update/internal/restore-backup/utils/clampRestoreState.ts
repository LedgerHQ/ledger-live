import {
  RestoreBackupStateType,
  type RestoreBackupState,
} from "../../../api/model/RestoreBackupState";

export const clampRestoreState = (
  lastProgress: number,
  state: RestoreBackupState,
): RestoreBackupState => {
  if (state.type !== RestoreBackupStateType.RESTORING) {
    return state;
  }

  const progress = Math.max(lastProgress, state.progress);
  if (progress === state.progress) {
    return state;
  }

  return { type: RestoreBackupStateType.RESTORING, progress };
};
