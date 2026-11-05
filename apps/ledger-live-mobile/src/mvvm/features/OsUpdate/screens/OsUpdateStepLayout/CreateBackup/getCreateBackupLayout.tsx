import React from "react";
import { CreateBackupStateType, type CreateBackupState } from "@ledgerhq/live-dmk-shared";
import type { DeviceModelId } from "@ledgerhq/types-devices";
import type { OsUpdateSheetSpec, OsUpdateStepLayoutSpec } from "..";
import { getConnectionTimedOutSheet } from "../getConnectionTimedOutSheet";
import { OsUpdateButton } from "../../../analytics/types";
import { PreparingScreen } from "../../PreparingScreen";
import { BackupSelectionContent } from "../../../sheets/BackupSelectionContent";
import { ContinueOnDeviceContent } from "../../../sheets/ContinueOnDeviceContent";
import { DeviceDisconnectedContent } from "../../../sheets/DeviceDisconnectedContent";
import { DeviceLockedContent } from "../../../sheets/DeviceLockedContent";
import { SecureConnectionRefusedContent } from "../../../sheets/SecureConnectionRefusedContent";
import { UnexpectedErrorContent } from "../../../sheets/UnexpectedErrorContent";

type Props = Readonly<{
  state: CreateBackupState;
  deviceModelId: DeviceModelId;
  deviceName: string;
  trackClick: (button: OsUpdateButton) => void;
  exportLogs: () => void;
}>;

function getSheet({
  state,
  deviceModelId,
  deviceName,
  trackClick,
  exportLogs,
}: Props): OsUpdateSheetSpec | undefined {
  switch (state.type) {
    case CreateBackupStateType.LOADING:
      return undefined;
    case CreateBackupStateType.AWAITING_BACKUP_SELECTION: {
      const onUseExisting = () => {
        trackClick(OsUpdateButton.USE_EXISTING_BACKUP);
        state.useExistingBackup();
      };
      const onCreateNew = () => {
        trackClick(OsUpdateButton.CREATE_NEW_BACKUP);
        state.createNewBackup();
      };
      return {
        hideHeader: true,
        content: (
          <BackupSelectionContent
            deviceModelId={deviceModelId}
            backupCreatedAt={state.backupCreatedAt}
            onUseExisting={onUseExisting}
            onCreateNew={onCreateNew}
          />
        ),
      };
    }
    case CreateBackupStateType.DEVICE_LOCKED:
      return {
        content: <DeviceLockedContent deviceModelId={deviceModelId} deviceName={deviceName} />,
      };
    case CreateBackupStateType.AWAITING_ALLOW_SECURE_CONNECTION:
      return {
        content: <ContinueOnDeviceContent deviceModelId={deviceModelId} deviceName={deviceName} />,
      };
    case CreateBackupStateType.ALLOW_SECURE_CONNECTION_REFUSED: {
      const onRetry = () => {
        trackClick(OsUpdateButton.RETRY);
        state.retry();
      };
      const onCancel = () => {
        trackClick(OsUpdateButton.CANCEL);
        state.cancel();
      };
      return {
        hideHeader: true,
        content: <SecureConnectionRefusedContent onRetry={onRetry} onCancel={onCancel} />,
      };
    }
    case CreateBackupStateType.DEVICE_DISCONNECTED:
      return { content: <DeviceDisconnectedContent /> };
    case CreateBackupStateType.CONNECTION_TIMED_OUT:
      return getConnectionTimedOutSheet({ retry: state.retry, trackClick, exportLogs });
    case CreateBackupStateType.UNEXPECTED_ERROR: {
      const onCancel = () => {
        trackClick(OsUpdateButton.CANCEL);
        state.cancel();
      };
      return {
        content: <UnexpectedErrorContent onCancel={onCancel} />,
      };
    }
    default: {
      const unhandled: never = state;
      return unhandled;
    }
  }
}

export function getCreateBackupLayout(props: Props): OsUpdateStepLayoutSpec {
  return { screen: <PreparingScreen />, sheet: getSheet(props) };
}
