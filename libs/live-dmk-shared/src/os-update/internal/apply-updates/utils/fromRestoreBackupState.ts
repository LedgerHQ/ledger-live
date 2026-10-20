import {
  ApplyUpdatesStateType,
  type ApplyUpdatesState,
} from "../../../api/model/ApplyUpdatesState";
import {
  RestoreBackupStateType,
  type RestoreBackupState,
} from "../../../api/model/RestoreBackupState";

/**
 * The restore step speaks for itself, and an update ending with one has to speak for the whole
 * run: same states, a bar scaled to the share the restore is worth, and `overall` computed by the
 * caller since it owns the other nine tenths.
 *
 * Null where the step says something the update says for itself: its completion is not the run's,
 * and its loading is covered by whatever the bar already shows.
 */
export const fromRestoreBackupState = (
  state: RestoreBackupState,
  overall: number,
): ApplyUpdatesState | null => {
  switch (state.type) {
    case RestoreBackupStateType.RESTORING:
      return { type: ApplyUpdatesStateType.RESTORING, progress: overall };
    case RestoreBackupStateType.DEVICE_LOCKED:
      return { type: ApplyUpdatesStateType.DEVICE_LOCKED };
    case RestoreBackupStateType.AWAITING_ALLOW_SECURE_CONNECTION:
      return { type: ApplyUpdatesStateType.AWAITING_ALLOW_SECURE_CONNECTION };
    case RestoreBackupStateType.ALLOW_SECURE_CONNECTION_REFUSED:
      return {
        type: ApplyUpdatesStateType.ALLOW_SECURE_CONNECTION_REFUSED,
        retry: state.retry,
        cancel: state.cancel,
      };
    case RestoreBackupStateType.AWAITING_GRANT_CONSENT:
      return { type: ApplyUpdatesStateType.AWAITING_GRANT_CONSENT };
    case RestoreBackupStateType.AWAITING_ALLOW_LIST_APPS:
      return { type: ApplyUpdatesStateType.AWAITING_ALLOW_LIST_APPS };
    case RestoreBackupStateType.AWAITING_CONFIRM_LOAD_IMAGE:
      return { type: ApplyUpdatesStateType.AWAITING_CONFIRM_LOAD_IMAGE };
    case RestoreBackupStateType.AWAITING_CONFIRM_COMMIT_IMAGE:
      return { type: ApplyUpdatesStateType.AWAITING_CONFIRM_COMMIT_IMAGE };
    case RestoreBackupStateType.DEVICE_DISCONNECTED:
      return { type: ApplyUpdatesStateType.DEVICE_DISCONNECTED };
    case RestoreBackupStateType.OUT_OF_MEMORY:
      return { type: ApplyUpdatesStateType.OUT_OF_MEMORY, cancel: state.cancel };
    case RestoreBackupStateType.UNEXPECTED_ERROR:
      return { type: ApplyUpdatesStateType.UNEXPECTED_ERROR, cancel: state.cancel };
    case RestoreBackupStateType.LOADING:
    case RestoreBackupStateType.BACKUP_RESTORED:
      return null;
    default: {
      const unhandled: never = state;
      return unhandled;
    }
  }
};
