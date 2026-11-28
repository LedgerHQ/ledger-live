import { ApplyUpdatesStateType, type ApplyUpdatesState } from "@features/platform-device-os-update";
import type {
  FinishingProgressInput,
  FinishingProgressResult,
} from "../../../../hooks/useFinishingProgress";
import { OsUpdateButton } from "../../../../analytics/analyticsTypes";
import {
  connectionTimedOutSheet,
  secureConnectionRefusedSheet,
  unexpectedErrorSheet,
} from "../sheets";
import { trackedAction } from "../trackedAction";
import type { OsUpdateScreen } from "../../../../types/OsUpdateScreen";
import type { OsUpdateSheet } from "../../../../types/OsUpdateSheet";
import type { OsUpdateStepDescriptor } from "../../../../types/OsUpdateStepDescriptor";
import type { TrackClick } from "../../../../types/TrackClick";

type Input = Readonly<{
  state: ApplyUpdatesState;
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
    case ApplyUpdatesStateType.UPDATING:
      return {
        type: "progress",
        progress: state.progress,
        isRestoring: false,
        update: { index: state.updateIndex, count: state.updateCount },
      };
    case ApplyUpdatesStateType.RESTORING:
      return { type: "progress", progress: state.progress, isRestoring: true };
    case ApplyUpdatesStateType.UPDATES_APPLIED:
      if (finishing) {
        return {
          type: "progress",
          progress: 1,
          isRestoring: finishing.display.isRestoring,
          update: finishing.display.update,
          finishing: { from: finishing.from, onFinished: finishing.onFinished },
        };
      }
      return {
        type: "applied",
        isRestoreOnly: false,
        osVersion: state.osVersion,
        restoreStatus: state.restoreResult?.restoreStatus,
        onClose,
      };
    case ApplyUpdatesStateType.LOADING:
    case ApplyUpdatesStateType.DEVICE_LOCKED:
    case ApplyUpdatesStateType.AWAITING_UPDATE_COMPLETE:
    case ApplyUpdatesStateType.AWAITING_ALLOW_SECURE_CONNECTION:
    case ApplyUpdatesStateType.AWAITING_ALLOW_INSTALL_FIRMWARE:
    case ApplyUpdatesStateType.AWAITING_GRANT_CONSENT:
    case ApplyUpdatesStateType.AWAITING_ALLOW_LIST_APPS:
    case ApplyUpdatesStateType.AWAITING_CONFIRM_LOAD_IMAGE:
    case ApplyUpdatesStateType.AWAITING_CONFIRM_COMMIT_IMAGE:
    case ApplyUpdatesStateType.ALLOW_SECURE_CONNECTION_REFUSED:
    case ApplyUpdatesStateType.ALLOW_INSTALL_FIRMWARE_REFUSED:
    case ApplyUpdatesStateType.DEVICE_DISCONNECTED:
    case ApplyUpdatesStateType.CONNECTION_TIMED_OUT:
    case ApplyUpdatesStateType.UNEXPECTED_ERROR:
      return {
        type: "progress",
        progress: lastDisplay?.progress ?? 0,
        isRestoring: lastDisplay?.isRestoring ?? false,
        update: lastDisplay?.update,
      };
    default: {
      const unhandled: never = state;
      return unhandled;
    }
  }
}

function getSheet({ state, trackClick }: Input): OsUpdateSheet | undefined {
  switch (state.type) {
    case ApplyUpdatesStateType.LOADING:
    case ApplyUpdatesStateType.UPDATING:
    case ApplyUpdatesStateType.RESTORING:
    case ApplyUpdatesStateType.UPDATES_APPLIED:
      return undefined;
    case ApplyUpdatesStateType.DEVICE_LOCKED:
      return { type: "deviceLocked" };
    case ApplyUpdatesStateType.AWAITING_UPDATE_COMPLETE:
    case ApplyUpdatesStateType.AWAITING_ALLOW_SECURE_CONNECTION:
    case ApplyUpdatesStateType.AWAITING_ALLOW_INSTALL_FIRMWARE:
    case ApplyUpdatesStateType.AWAITING_GRANT_CONSENT:
    case ApplyUpdatesStateType.AWAITING_ALLOW_LIST_APPS:
    case ApplyUpdatesStateType.AWAITING_CONFIRM_LOAD_IMAGE:
    case ApplyUpdatesStateType.AWAITING_CONFIRM_COMMIT_IMAGE:
      return { type: "continueOnDevice" };
    case ApplyUpdatesStateType.ALLOW_SECURE_CONNECTION_REFUSED:
      return secureConnectionRefusedSheet(state, trackClick);
    case ApplyUpdatesStateType.ALLOW_INSTALL_FIRMWARE_REFUSED:
      return {
        type: "installFirmwareRefused",
        onRetry: trackedAction(trackClick, OsUpdateButton.RESTART_OS_UPDATE, state.retry),
        onCancel: trackedAction(trackClick, OsUpdateButton.CANCEL_OS_UPDATE, state.cancel),
      };
    case ApplyUpdatesStateType.DEVICE_DISCONNECTED:
      return { type: "deviceDisconnected" };
    case ApplyUpdatesStateType.CONNECTION_TIMED_OUT:
      return connectionTimedOutSheet(state, trackClick);
    case ApplyUpdatesStateType.UNEXPECTED_ERROR:
      return unexpectedErrorSheet(state.cancel, trackClick);
    default: {
      const unhandled: never = state;
      return unhandled;
    }
  }
}

export function resolveApplyUpdatesStep(input: Input): OsUpdateStepDescriptor {
  return { screen: getScreen(input), sheet: getSheet(input) };
}

export function getApplyUpdatesProgress(state: ApplyUpdatesState): FinishingProgressInput {
  switch (state.type) {
    case ApplyUpdatesStateType.UPDATING:
      return {
        display: {
          progress: state.progress,
          isRestoring: false,
          update: { index: state.updateIndex, count: state.updateCount },
        },
        isDone: false,
      };
    case ApplyUpdatesStateType.RESTORING:
      return { display: { progress: state.progress, isRestoring: true }, isDone: false };
    case ApplyUpdatesStateType.UPDATES_APPLIED:
      return { display: undefined, isDone: true };
    case ApplyUpdatesStateType.LOADING:
    case ApplyUpdatesStateType.DEVICE_LOCKED:
    case ApplyUpdatesStateType.AWAITING_UPDATE_COMPLETE:
    case ApplyUpdatesStateType.AWAITING_ALLOW_SECURE_CONNECTION:
    case ApplyUpdatesStateType.AWAITING_ALLOW_INSTALL_FIRMWARE:
    case ApplyUpdatesStateType.AWAITING_GRANT_CONSENT:
    case ApplyUpdatesStateType.AWAITING_ALLOW_LIST_APPS:
    case ApplyUpdatesStateType.AWAITING_CONFIRM_LOAD_IMAGE:
    case ApplyUpdatesStateType.AWAITING_CONFIRM_COMMIT_IMAGE:
    case ApplyUpdatesStateType.ALLOW_SECURE_CONNECTION_REFUSED:
    case ApplyUpdatesStateType.ALLOW_INSTALL_FIRMWARE_REFUSED:
    case ApplyUpdatesStateType.DEVICE_DISCONNECTED:
    case ApplyUpdatesStateType.CONNECTION_TIMED_OUT:
    case ApplyUpdatesStateType.UNEXPECTED_ERROR:
      return { display: undefined, isDone: false };
    default: {
      const unhandled: never = state;
      return unhandled;
    }
  }
}
