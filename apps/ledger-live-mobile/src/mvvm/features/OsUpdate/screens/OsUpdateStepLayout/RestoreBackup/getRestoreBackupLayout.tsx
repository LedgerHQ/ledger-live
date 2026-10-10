import React from "react";
import { RestoreBackupStateType, type RestoreBackupState } from "@ledgerhq/live-dmk-shared";
import type { DeviceModelId } from "@ledgerhq/types-devices";
import type {
  FinishingProgress,
  FinishingProgressInput,
  ProgressDisplay,
} from "../../../hooks/useFinishingProgress";
import type { OsUpdateSheetSpec, OsUpdateStepLayoutSpec } from "..";
import { FINISHING_ANIMATION_MS } from "../../UpdateProgressScreen/ProgressBar";
import { UpdateProgressScreen } from "../../UpdateProgressScreen";
import { UpdatesAppliedScreen } from "../../UpdatesAppliedScreen";
import { ContinueOnDeviceContent } from "../../../sheets/ContinueOnDeviceContent";
import { DeviceDisconnectedContent } from "../../../sheets/DeviceDisconnectedContent";
import { DeviceLockedContent } from "../../../sheets/DeviceLockedContent";
import { OutOfMemoryContent } from "../../../sheets/OutOfMemoryContent";
import { SecureConnectionRefusedContent } from "../../../sheets/SecureConnectionRefusedContent";
import { UnexpectedErrorContent } from "../../../sheets/UnexpectedErrorContent";

type Props = Readonly<{
  state: RestoreBackupState;
  deviceModelId: DeviceModelId;
  deviceName: string;
  productName: string;
  /** Set while the bar fills up to 100% before the success screen. */
  finishing?: FinishingProgress;
  /** The last progress shown, kept behind the sheets. */
  lastDisplay?: ProgressDisplay;
  onClose: () => void;
}>;

function getScreen({
  state,
  productName,
  finishing,
  lastDisplay,
  onClose,
}: Props): React.ReactNode {
  switch (state.type) {
    case RestoreBackupStateType.RESTORING:
      return (
        <UpdateProgressScreen productName={productName} progress={state.progress} isRestoring />
      );
    case RestoreBackupStateType.BACKUP_RESTORED:
      if (finishing) {
        return (
          <UpdateProgressScreen
            productName={productName}
            progress={1}
            initialProgress={finishing.from}
            progressAnimationMs={FINISHING_ANIMATION_MS}
            isRestoring
            onProgressAnimationEnd={finishing.onFinished}
          />
        );
      }
      return <UpdatesAppliedScreen productName={productName} isRestoreOnly onClose={onClose} />;
    case RestoreBackupStateType.LOADING:
    case RestoreBackupStateType.DEVICE_LOCKED:
    case RestoreBackupStateType.AWAITING_ALLOW_SECURE_CONNECTION:
    case RestoreBackupStateType.AWAITING_GRANT_CONSENT:
    case RestoreBackupStateType.AWAITING_ALLOW_LIST_APPS:
    case RestoreBackupStateType.AWAITING_CONFIRM_LOAD_IMAGE:
    case RestoreBackupStateType.AWAITING_CONFIRM_COMMIT_IMAGE:
    case RestoreBackupStateType.ALLOW_SECURE_CONNECTION_REFUSED:
    case RestoreBackupStateType.DEVICE_DISCONNECTED:
    case RestoreBackupStateType.OUT_OF_MEMORY:
    case RestoreBackupStateType.UNEXPECTED_ERROR:
      return (
        <UpdateProgressScreen
          productName={productName}
          progress={lastDisplay?.progress ?? 0}
          isRestoring
        />
      );
    default: {
      const unhandled: never = state;
      return unhandled;
    }
  }
}

function getSheet({ state, deviceModelId, deviceName }: Props): OsUpdateSheetSpec | undefined {
  switch (state.type) {
    case RestoreBackupStateType.LOADING:
    case RestoreBackupStateType.RESTORING:
    case RestoreBackupStateType.BACKUP_RESTORED:
      return undefined;
    case RestoreBackupStateType.DEVICE_LOCKED:
      return {
        content: <DeviceLockedContent deviceModelId={deviceModelId} deviceName={deviceName} />,
      };
    case RestoreBackupStateType.AWAITING_ALLOW_SECURE_CONNECTION:
    case RestoreBackupStateType.AWAITING_GRANT_CONSENT:
    case RestoreBackupStateType.AWAITING_ALLOW_LIST_APPS:
    case RestoreBackupStateType.AWAITING_CONFIRM_LOAD_IMAGE:
    case RestoreBackupStateType.AWAITING_CONFIRM_COMMIT_IMAGE:
      return {
        content: <ContinueOnDeviceContent deviceModelId={deviceModelId} deviceName={deviceName} />,
      };
    case RestoreBackupStateType.ALLOW_SECURE_CONNECTION_REFUSED:
      return {
        content: <SecureConnectionRefusedContent onRetry={state.retry} onCancel={state.cancel} />,
      };
    case RestoreBackupStateType.DEVICE_DISCONNECTED:
      return { content: <DeviceDisconnectedContent /> };
    case RestoreBackupStateType.OUT_OF_MEMORY:
      return { content: <OutOfMemoryContent onCancel={state.cancel} /> };
    case RestoreBackupStateType.UNEXPECTED_ERROR:
      return {
        content: <UnexpectedErrorContent onCancel={state.cancel} />,
      };
    default: {
      const unhandled: never = state;
      return unhandled;
    }
  }
}

/** The full-screen state and the bottom sheet state that the RestoreBackup step displays. */
export function getRestoreBackupLayout(props: Props): OsUpdateStepLayoutSpec {
  return { screen: getScreen(props), sheet: getSheet(props) };
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
    case RestoreBackupStateType.OUT_OF_MEMORY:
    case RestoreBackupStateType.UNEXPECTED_ERROR:
      return { display: undefined, isDone: false };
    default: {
      const unhandled: never = state;
      return unhandled;
    }
  }
}
