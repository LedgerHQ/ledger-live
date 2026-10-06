import React from "react";
import { ApplyUpdatesStateType, type ApplyUpdatesState } from "@ledgerhq/live-dmk-shared";
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
import { InstallFirmwareRefusedContent } from "../../../sheets/InstallFirmwareRefusedContent";
import { OutOfMemoryContent } from "../../../sheets/OutOfMemoryContent";
import { SecureConnectionRefusedContent } from "../../../sheets/SecureConnectionRefusedContent";
import { UnexpectedErrorContent } from "../../../sheets/UnexpectedErrorContent";

type Props = Readonly<{
  state: ApplyUpdatesState;
  deviceModelId: DeviceModelId;
  deviceName: string;
  productName: string;
  finishing?: FinishingProgress;
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
    case ApplyUpdatesStateType.UPDATING:
      return (
        <UpdateProgressScreen
          productName={productName}
          progress={state.progress}
          isRestoring={false}
          update={{ index: state.updateIndex, count: state.updateCount }}
        />
      );
    case ApplyUpdatesStateType.RESTORING:
      return (
        <UpdateProgressScreen productName={productName} progress={state.progress} isRestoring />
      );
    case ApplyUpdatesStateType.UPDATES_APPLIED:
      if (finishing) {
        return (
          <UpdateProgressScreen
            productName={productName}
            progress={1}
            initialProgress={finishing.from}
            progressAnimationMs={FINISHING_ANIMATION_MS}
            isRestoring={finishing.display.isRestoring}
            update={finishing.display.update}
            onProgressAnimationEnd={finishing.onFinished}
          />
        );
      }
      return (
        <UpdatesAppliedScreen productName={productName} isRestoreOnly={false} onClose={onClose} />
      );
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
    case ApplyUpdatesStateType.OUT_OF_MEMORY:
    case ApplyUpdatesStateType.UNEXPECTED_ERROR:
      return (
        <UpdateProgressScreen
          productName={productName}
          progress={lastDisplay?.progress ?? 0}
          isRestoring={lastDisplay?.isRestoring ?? false}
          update={lastDisplay?.update}
        />
      );
    default: {
      const unhandled: never = state;
      return unhandled;
    }
  }
}

function getSheet({ state, deviceModelId, deviceName }: Props): OsUpdateSheetSpec | undefined {
  const continueOnDevice = {
    content: <ContinueOnDeviceContent deviceModelId={deviceModelId} deviceName={deviceName} />,
  };

  switch (state.type) {
    case ApplyUpdatesStateType.LOADING:
    case ApplyUpdatesStateType.UPDATING:
    case ApplyUpdatesStateType.RESTORING:
    case ApplyUpdatesStateType.UPDATES_APPLIED:
      return undefined;
    case ApplyUpdatesStateType.DEVICE_LOCKED:
      return {
        content: <DeviceLockedContent deviceModelId={deviceModelId} deviceName={deviceName} />,
      };
    case ApplyUpdatesStateType.AWAITING_UPDATE_COMPLETE:
    case ApplyUpdatesStateType.AWAITING_ALLOW_SECURE_CONNECTION:
    case ApplyUpdatesStateType.AWAITING_ALLOW_INSTALL_FIRMWARE:
    case ApplyUpdatesStateType.AWAITING_GRANT_CONSENT:
    case ApplyUpdatesStateType.AWAITING_ALLOW_LIST_APPS:
    case ApplyUpdatesStateType.AWAITING_CONFIRM_LOAD_IMAGE:
    case ApplyUpdatesStateType.AWAITING_CONFIRM_COMMIT_IMAGE:
      return continueOnDevice;
    case ApplyUpdatesStateType.ALLOW_SECURE_CONNECTION_REFUSED:
      return {
        content: <SecureConnectionRefusedContent onRetry={state.retry} onCancel={state.cancel} />,
      };
    case ApplyUpdatesStateType.ALLOW_INSTALL_FIRMWARE_REFUSED:
      return {
        content: <InstallFirmwareRefusedContent onCancel={state.cancel} />,
      };
    case ApplyUpdatesStateType.DEVICE_DISCONNECTED:
      return { content: <DeviceDisconnectedContent /> };
    case ApplyUpdatesStateType.OUT_OF_MEMORY:
      return { content: <OutOfMemoryContent onCancel={state.cancel} /> };
    case ApplyUpdatesStateType.UNEXPECTED_ERROR:
      return {
        content: <UnexpectedErrorContent onCancel={state.cancel} />,
      };
    default: {
      const unhandled: never = state;
      return unhandled;
    }
  }
}

export function getApplyUpdatesLayout(props: Props): OsUpdateStepLayoutSpec {
  return { screen: getScreen(props), sheet: getSheet(props) };
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
    case ApplyUpdatesStateType.OUT_OF_MEMORY:
    case ApplyUpdatesStateType.UNEXPECTED_ERROR:
      return { display: undefined, isDone: false };
    default: {
      const unhandled: never = state;
      return unhandled;
    }
  }
}
