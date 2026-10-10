import React from "react";
import { CreateBackupStateType, type CreateBackupState } from "@ledgerhq/live-dmk-shared";
import type { DeviceModelId } from "@ledgerhq/types-devices";
import { InfoState } from "@shared/ui-info-state";
import { Trans } from "~/context/Locale";
import type { OsUpdateSheetSpec, OsUpdateStepLayoutSpec } from "..";
import { PreparingScreen } from "../../PreparingScreen";
import { ContinueOnDeviceContent } from "../../../sheets/ContinueOnDeviceContent";
import { DeviceDisconnectedContent } from "../../../sheets/DeviceDisconnectedContent";
import { DeviceLockedContent } from "../../../sheets/DeviceLockedContent";
import { SecureConnectionRefusedContent } from "../../../sheets/SecureConnectionRefusedContent";
import { UnexpectedErrorContent } from "../../../sheets/UnexpectedErrorContent";

type Props = Readonly<{
  state: CreateBackupState;
  deviceModelId: DeviceModelId;
  deviceName: string;
}>;

function getSheet({ state, deviceModelId, deviceName }: Props): OsUpdateSheetSpec | undefined {
  switch (state.type) {
    case CreateBackupStateType.LOADING:
      return undefined;
    case CreateBackupStateType.AWAITING_BACKUP_SELECTION:
      return {
        content: (
          <InfoState
            preset="info"
            size="hug"
            title={<Trans i18nKey="osUpdates.backupSelection.title" />}
            description={<Trans i18nKey="osUpdates.backupSelection.description" />}
            primaryCta={{
              label: <Trans i18nKey="osUpdates.backupSelection.useExisting" />,
              onPress: state.useExistingBackup,
              testID: "os-update-use-existing-backup",
            }}
            secondaryCta={{
              label: <Trans i18nKey="osUpdates.backupSelection.createNew" />,
              onPress: state.createNewBackup,
              testID: "os-update-create-new-backup",
            }}
            testID="os-update-backup-selection"
          />
        ),
      };
    case CreateBackupStateType.DEVICE_LOCKED:
      return {
        content: <DeviceLockedContent deviceModelId={deviceModelId} deviceName={deviceName} />,
      };
    case CreateBackupStateType.AWAITING_ALLOW_SECURE_CONNECTION:
      return {
        content: <ContinueOnDeviceContent deviceModelId={deviceModelId} deviceName={deviceName} />,
      };
    case CreateBackupStateType.ALLOW_SECURE_CONNECTION_REFUSED:
      return {
        content: <SecureConnectionRefusedContent onRetry={state.retry} onCancel={state.cancel} />,
      };
    case CreateBackupStateType.DEVICE_DISCONNECTED:
      return { content: <DeviceDisconnectedContent /> };
    case CreateBackupStateType.UNEXPECTED_ERROR:
      return {
        content: <UnexpectedErrorContent onCancel={state.cancel} />,
      };
    default: {
      const unhandled: never = state;
      return unhandled;
    }
  }
}

export function getCreateBackupLayout(props: Props): OsUpdateStepLayoutSpec {
  return { screen: <PreparingScreen />, sheet: getSheet(props) };
}
