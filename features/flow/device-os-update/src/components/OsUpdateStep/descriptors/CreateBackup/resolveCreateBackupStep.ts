import { CreateBackupStateType, type CreateBackupState } from "@features/platform-device-os-update";
import { OsUpdateButton } from "../../../../analytics/analyticsTypes";
import {
  connectionTimedOutSheet,
  secureConnectionRefusedSheet,
  unexpectedErrorSheet,
} from "../sheets";
import { trackedAction } from "../trackedAction";
import type { OsUpdateSheet } from "../../../../types/OsUpdateSheet";
import type { OsUpdateStepDescriptor } from "../../../../types/OsUpdateStepDescriptor";
import type { TrackClick } from "../../../../types/TrackClick";

function getSheet(state: CreateBackupState, trackClick: TrackClick): OsUpdateSheet | undefined {
  switch (state.type) {
    case CreateBackupStateType.LOADING:
      return undefined;
    case CreateBackupStateType.AWAITING_BACKUP_SELECTION:
      return {
        type: "backupSelection",
        backupCreatedAt: state.backupCreatedAt,
        onUseExisting: trackedAction(
          trackClick,
          OsUpdateButton.USE_EXISTING_BACKUP,
          state.useExistingBackup,
        ),
        onCreateNew: trackedAction(
          trackClick,
          OsUpdateButton.CREATE_NEW_BACKUP,
          state.createNewBackup,
        ),
      };
    case CreateBackupStateType.DEVICE_LOCKED:
      return { type: "deviceLocked" };
    case CreateBackupStateType.AWAITING_ALLOW_SECURE_CONNECTION:
      return { type: "continueOnDevice" };
    case CreateBackupStateType.ALLOW_SECURE_CONNECTION_REFUSED:
      return secureConnectionRefusedSheet(state, trackClick);
    case CreateBackupStateType.DEVICE_DISCONNECTED:
      return { type: "deviceDisconnected" };
    case CreateBackupStateType.CONNECTION_TIMED_OUT:
      return connectionTimedOutSheet(state, trackClick);
    case CreateBackupStateType.UNEXPECTED_ERROR:
      return unexpectedErrorSheet(state.cancel, trackClick);
    default: {
      const unhandled: never = state;
      return unhandled;
    }
  }
}

export function resolveCreateBackupStep(
  state: CreateBackupState,
  trackClick: TrackClick,
): OsUpdateStepDescriptor {
  return { screen: { type: "preparing" }, sheet: getSheet(state, trackClick) };
}
