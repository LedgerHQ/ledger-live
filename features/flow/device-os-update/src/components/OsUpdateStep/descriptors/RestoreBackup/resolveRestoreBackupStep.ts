import {
  RestoreBackupStateType,
  type RestoreBackupState,
} from "@features/platform-device-os-update";
import type {
  FinishingProgressInput,
  FinishingProgressResult,
} from "../../../../hooks/useFinishingProgress";
import {
  connectionTimedOutSheet,
  secureConnectionRefusedSheet,
  unexpectedErrorSheet,
} from "../sheets";
import type { OsUpdateScreen } from "../../../../types/OsUpdateScreen";
import type { OsUpdateSheet } from "../../../../types/OsUpdateSheet";
import type { OsUpdateStepDescriptor } from "../../../../types/OsUpdateStepDescriptor";
import type { TrackClick } from "../../../../types/TrackClick";

type Input = Readonly<{
  state: RestoreBackupState;
  progress: FinishingProgressResult;
  onClose: () => void;
  trackClick: TrackClick;
}>;

function getScreen({
  state,
  progress: { finishing, lastDisplay },
  onClose,
}: Input): OsUpdateScreen {
  switch (state.type) {
    case RestoreBackupStateType.RESTORING:
      return { type: "progress", progress: state.progress, isRestoring: true };
    case RestoreBackupStateType.BACKUP_RESTORED:
      if (finishing) {
        return {
          type: "progress",
          progress: 1,
          isRestoring: true,
          finishing: { from: finishing.from, onFinished: finishing.onFinished },
        };
      }
      return {
        type: "applied",
        isRestoreOnly: true,
        restoreStatus: state.restoreResult?.restoreStatus,
        onClose,
      };
    case RestoreBackupStateType.LOADING:
    case RestoreBackupStateType.DEVICE_LOCKED:
    case RestoreBackupStateType.AWAITING_ALLOW_SECURE_CONNECTION:
    case RestoreBackupStateType.AWAITING_GRANT_CONSENT:
    case RestoreBackupStateType.AWAITING_ALLOW_LIST_APPS:
    case RestoreBackupStateType.AWAITING_CONFIRM_LOAD_IMAGE:
    case RestoreBackupStateType.AWAITING_CONFIRM_COMMIT_IMAGE:
    case RestoreBackupStateType.ALLOW_SECURE_CONNECTION_REFUSED:
    case RestoreBackupStateType.DEVICE_DISCONNECTED:
    case RestoreBackupStateType.CONNECTION_TIMED_OUT:
    case RestoreBackupStateType.UNEXPECTED_ERROR:
      return { type: "progress", progress: lastDisplay?.progress ?? 0, isRestoring: true };
    default: {
      const unhandled: never = state;
      return unhandled;
    }
  }
}

function getSheet({ state, trackClick }: Input): OsUpdateSheet | undefined {
  switch (state.type) {
    case RestoreBackupStateType.LOADING:
    case RestoreBackupStateType.RESTORING:
    case RestoreBackupStateType.BACKUP_RESTORED:
      return undefined;
    case RestoreBackupStateType.DEVICE_LOCKED:
      return { type: "deviceLocked" };
    case RestoreBackupStateType.AWAITING_ALLOW_SECURE_CONNECTION:
    case RestoreBackupStateType.AWAITING_GRANT_CONSENT:
    case RestoreBackupStateType.AWAITING_ALLOW_LIST_APPS:
    case RestoreBackupStateType.AWAITING_CONFIRM_LOAD_IMAGE:
    case RestoreBackupStateType.AWAITING_CONFIRM_COMMIT_IMAGE:
      return { type: "continueOnDevice" };
    case RestoreBackupStateType.ALLOW_SECURE_CONNECTION_REFUSED:
      return secureConnectionRefusedSheet(state, trackClick);
    case RestoreBackupStateType.DEVICE_DISCONNECTED:
      return { type: "deviceDisconnected" };
    case RestoreBackupStateType.CONNECTION_TIMED_OUT:
      return connectionTimedOutSheet(state, trackClick);
    case RestoreBackupStateType.UNEXPECTED_ERROR:
      return unexpectedErrorSheet(state.cancel, trackClick);
    default: {
      const unhandled: never = state;
      return unhandled;
    }
  }
}

/** The full-screen state and the bottom sheet state that the RestoreBackup step displays. */
export function resolveRestoreBackupStep(input: Input): OsUpdateStepDescriptor {
  return { screen: getScreen(input), sheet: getSheet(input) };
}

/** What the step displays as progress, and whether it is done, to fill the bar before its end. */
export function getRestoreBackupProgress(state: RestoreBackupState): FinishingProgressInput {
  switch (state.type) {
    case RestoreBackupStateType.RESTORING:
      return { display: { progress: state.progress, isRestoring: true }, isDone: false };
    case RestoreBackupStateType.BACKUP_RESTORED:
      return { display: undefined, isDone: true };
    case RestoreBackupStateType.LOADING:
    case RestoreBackupStateType.DEVICE_LOCKED:
    case RestoreBackupStateType.AWAITING_ALLOW_SECURE_CONNECTION:
    case RestoreBackupStateType.AWAITING_GRANT_CONSENT:
    case RestoreBackupStateType.AWAITING_ALLOW_LIST_APPS:
    case RestoreBackupStateType.AWAITING_CONFIRM_LOAD_IMAGE:
    case RestoreBackupStateType.AWAITING_CONFIRM_COMMIT_IMAGE:
    case RestoreBackupStateType.ALLOW_SECURE_CONNECTION_REFUSED:
    case RestoreBackupStateType.DEVICE_DISCONNECTED:
    case RestoreBackupStateType.CONNECTION_TIMED_OUT:
    case RestoreBackupStateType.UNEXPECTED_ERROR:
      return { display: undefined, isDone: false };
    default: {
      const unhandled: never = state;
      return unhandled;
    }
  }
}
