import {
  ApplyUpdatesStateType,
  CreateBackupStateType,
  OsUpdatesSteps,
  PreChecksStateType,
  RestoreBackupStateType,
  type ApplyUpdatesState,
  type OsUpdate,
  type OsUpdatesProgress,
} from "@ledgerhq/live-dmk-shared";
import {
  OsUpdateDeviceAction,
  OsUpdateFailureType,
  OsUpdateFlowStep,
  OsUpdatePage,
  OsUpdateRestoreStatus,
  type OsUpdatePageEvent,
} from "./types";

type RestoreResult = Extract<
  ApplyUpdatesState,
  { type: ApplyUpdatesStateType.UPDATES_APPLIED }
>["restoreResult"];

export function getOsUpdateFlowStep(step: OsUpdatesSteps): OsUpdateFlowStep {
  switch (step) {
    case OsUpdatesSteps.PRE_CHECKS:
      return OsUpdateFlowStep.PRE_CHECKS;
    case OsUpdatesSteps.CREATE_BACKUP:
      return OsUpdateFlowStep.CREATE_BACKUP;
    case OsUpdatesSteps.APPLY_UPDATES:
      return OsUpdateFlowStep.APPLY_UPDATES;
    case OsUpdatesSteps.RESTORE_BACKUP:
      return OsUpdateFlowStep.RESTORE_BACKUP;
    default: {
      const unhandled: never = step;
      return unhandled;
    }
  }
}

function getRestoreStatus(restoreResult: RestoreResult): OsUpdateRestoreStatus {
  if (!restoreResult) return OsUpdateRestoreStatus.NONE;

  const outcomes = [
    restoreResult.restoredLanguage,
    restoreResult.restoredCLS,
    ...(restoreResult.restoredApps ?? []).flatMap(app => [app.restoredApp, app.restoredAppStorage]),
  ].filter(outcome => outcome !== undefined);

  if (outcomes.every(Boolean)) return OsUpdateRestoreStatus.FULL;
  if (outcomes.some(Boolean)) return OsUpdateRestoreStatus.PARTIAL;
  return OsUpdateRestoreStatus.NONE;
}

/** The DMK `_tag` or `Error.name` of the error a state carries. Never its message. */
function getSubError(state: object): string | undefined {
  const error: unknown = "error" in state ? state.error : undefined;
  if (typeof error !== "object" || error === null) return undefined;
  if ("_tag" in error && typeof error._tag === "string") return error._tag;
  if (error instanceof Error) return error.name;
  return undefined;
}

export function getPageEvent(
  progress: OsUpdatesProgress,
  osUpdates: readonly OsUpdate[],
): OsUpdatePageEvent | undefined {
  const step = getOsUpdateFlowStep(progress.step);
  const continueOnDevice = (deviceAction: OsUpdateDeviceAction): OsUpdatePageEvent => ({
    page: OsUpdatePage.CONTINUE_ON_DEVICE,
    step,
    deviceAction,
  });
  const error = (failureType: OsUpdateFailureType): OsUpdatePageEvent => {
    const subError = getSubError(progress.state);
    return {
      page: OsUpdatePage.ERROR,
      step,
      failureType,
      ...(subError === undefined ? {} : { subError }),
    };
  };

  switch (progress.step) {
    case OsUpdatesSteps.PRE_CHECKS: {
      const { state } = progress;
      switch (state.type) {
        case PreChecksStateType.LOADING:
          return { page: OsUpdatePage.PREPARING, step };
        case PreChecksStateType.BATTERY_TOO_LOW:
          return { page: OsUpdatePage.BATTERY_LOW, batteryLevel: state.currentPercentage };
        case PreChecksStateType.DEVICE_LOCKED:
          return { page: OsUpdatePage.DEVICE_LOCKED, step };
        case PreChecksStateType.DEVICE_DISCONNECTED:
          return { page: OsUpdatePage.DEVICE_DISCONNECTED, step };
        case PreChecksStateType.UNEXPECTED_ERROR:
          return error(OsUpdateFailureType.UNEXPECTED_ERROR);
        default: {
          const unhandled: never = state;
          return unhandled;
        }
      }
    }
    case OsUpdatesSteps.CREATE_BACKUP: {
      const { state } = progress;
      switch (state.type) {
        case CreateBackupStateType.LOADING:
          return { page: OsUpdatePage.PREPARING, step };
        case CreateBackupStateType.AWAITING_BACKUP_SELECTION:
          return { page: OsUpdatePage.EXISTING_BACKUP };
        case CreateBackupStateType.DEVICE_LOCKED:
          return { page: OsUpdatePage.DEVICE_LOCKED, step };
        case CreateBackupStateType.AWAITING_ALLOW_SECURE_CONNECTION:
          return continueOnDevice(OsUpdateDeviceAction.ALLOW_SECURE_CONNECTION);
        case CreateBackupStateType.ALLOW_SECURE_CONNECTION_REFUSED:
          return { page: OsUpdatePage.SECURE_CONNECTION_REFUSED, step };
        case CreateBackupStateType.DEVICE_DISCONNECTED:
          return { page: OsUpdatePage.DEVICE_DISCONNECTED, step };
        case CreateBackupStateType.UNEXPECTED_ERROR:
          return error(OsUpdateFailureType.UNEXPECTED_ERROR);
        default: {
          const unhandled: never = state;
          return unhandled;
        }
      }
    }
    case OsUpdatesSteps.APPLY_UPDATES: {
      const { state } = progress;
      switch (state.type) {
        case ApplyUpdatesStateType.LOADING:
          return undefined;
        case ApplyUpdatesStateType.UPDATING: {
          const osVersionTo = osUpdates[state.updateIndex - 1]?.finalFirmware.version;
          return {
            page: OsUpdatePage.INSTALLING,
            updateIndex: state.updateIndex,
            updateCount: state.updateCount,
            ...(osVersionTo === undefined ? {} : { osVersionTo }),
          };
        }
        case ApplyUpdatesStateType.RESTORING:
          return { page: OsUpdatePage.RESTORING };
        case ApplyUpdatesStateType.UPDATES_APPLIED:
          return {
            page: OsUpdatePage.SUCCESS,
            restoreStatus: getRestoreStatus(state.restoreResult),
          };
        case ApplyUpdatesStateType.DEVICE_LOCKED:
          return { page: OsUpdatePage.DEVICE_LOCKED, step };
        case ApplyUpdatesStateType.DEVICE_DISCONNECTED:
          return { page: OsUpdatePage.DEVICE_DISCONNECTED, step };
        case ApplyUpdatesStateType.AWAITING_UPDATE_COMPLETE:
          return continueOnDevice(OsUpdateDeviceAction.UPDATE_COMPLETE);
        case ApplyUpdatesStateType.AWAITING_ALLOW_SECURE_CONNECTION:
          return continueOnDevice(OsUpdateDeviceAction.ALLOW_SECURE_CONNECTION);
        case ApplyUpdatesStateType.AWAITING_ALLOW_INSTALL_FIRMWARE:
          return continueOnDevice(OsUpdateDeviceAction.ALLOW_INSTALL_FIRMWARE);
        case ApplyUpdatesStateType.AWAITING_GRANT_CONSENT:
          return continueOnDevice(OsUpdateDeviceAction.GRANT_CONSENT);
        case ApplyUpdatesStateType.AWAITING_ALLOW_LIST_APPS:
          return continueOnDevice(OsUpdateDeviceAction.ALLOW_LIST_APPS);
        case ApplyUpdatesStateType.AWAITING_CONFIRM_LOAD_IMAGE:
          return continueOnDevice(OsUpdateDeviceAction.CONFIRM_LOAD_IMAGE);
        case ApplyUpdatesStateType.AWAITING_CONFIRM_COMMIT_IMAGE:
          return continueOnDevice(OsUpdateDeviceAction.CONFIRM_COMMIT_IMAGE);
        case ApplyUpdatesStateType.ALLOW_SECURE_CONNECTION_REFUSED:
          return { page: OsUpdatePage.SECURE_CONNECTION_REFUSED, step };
        case ApplyUpdatesStateType.ALLOW_INSTALL_FIRMWARE_REFUSED:
          return error(OsUpdateFailureType.INSTALL_FIRMWARE_REFUSED);
        case ApplyUpdatesStateType.OUT_OF_MEMORY:
          return error(OsUpdateFailureType.OUT_OF_MEMORY);
        case ApplyUpdatesStateType.UNEXPECTED_ERROR:
          return error(OsUpdateFailureType.UNEXPECTED_ERROR);
        default: {
          const unhandled: never = state;
          return unhandled;
        }
      }
    }
    case OsUpdatesSteps.RESTORE_BACKUP: {
      const { state } = progress;
      switch (state.type) {
        case RestoreBackupStateType.LOADING:
        case RestoreBackupStateType.RESTORING:
          return { page: OsUpdatePage.RESTORING };
        case RestoreBackupStateType.BACKUP_RESTORED:
          return {
            page: OsUpdatePage.SUCCESS,
            restoreStatus: getRestoreStatus(state.restoreResult),
          };
        case RestoreBackupStateType.DEVICE_LOCKED:
          return { page: OsUpdatePage.DEVICE_LOCKED, step };
        case RestoreBackupStateType.DEVICE_DISCONNECTED:
          return { page: OsUpdatePage.DEVICE_DISCONNECTED, step };
        case RestoreBackupStateType.AWAITING_ALLOW_SECURE_CONNECTION:
          return continueOnDevice(OsUpdateDeviceAction.ALLOW_SECURE_CONNECTION);
        case RestoreBackupStateType.AWAITING_GRANT_CONSENT:
          return continueOnDevice(OsUpdateDeviceAction.GRANT_CONSENT);
        case RestoreBackupStateType.AWAITING_ALLOW_LIST_APPS:
          return continueOnDevice(OsUpdateDeviceAction.ALLOW_LIST_APPS);
        case RestoreBackupStateType.AWAITING_CONFIRM_LOAD_IMAGE:
          return continueOnDevice(OsUpdateDeviceAction.CONFIRM_LOAD_IMAGE);
        case RestoreBackupStateType.AWAITING_CONFIRM_COMMIT_IMAGE:
          return continueOnDevice(OsUpdateDeviceAction.CONFIRM_COMMIT_IMAGE);
        case RestoreBackupStateType.ALLOW_SECURE_CONNECTION_REFUSED:
          return { page: OsUpdatePage.SECURE_CONNECTION_REFUSED, step };
        case RestoreBackupStateType.OUT_OF_MEMORY:
          return error(OsUpdateFailureType.OUT_OF_MEMORY);
        case RestoreBackupStateType.UNEXPECTED_ERROR:
          return error(OsUpdateFailureType.UNEXPECTED_ERROR);
        default: {
          const unhandled: never = state;
          return unhandled;
        }
      }
    }
    default: {
      const unhandled: never = progress;
      return unhandled;
    }
  }
}
