import {
  RestoreBackupStateType,
  type RestoreBackupState,
} from "../../../api/model/RestoreBackupState";

/**
 * Two states of the same type are interchangeable, except while restoring: that one carries the
 * bar, so it is compared on its value too.
 */
export const isSameState = (previous: RestoreBackupState, next: RestoreBackupState): boolean => {
  if (previous.type !== next.type) {
    return false;
  }

  if (
    previous.type === RestoreBackupStateType.RESTORING &&
    next.type === RestoreBackupStateType.RESTORING
  ) {
    return previous.progress === next.progress;
  }

  return true;
};
