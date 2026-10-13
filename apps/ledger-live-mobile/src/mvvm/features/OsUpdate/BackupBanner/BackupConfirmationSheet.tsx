import React from "react";
import { Warning } from "@ledgerhq/lumen-ui-rnative/symbols";
import { InfoState } from "@shared/ui-info-state";
import { Trans } from "~/context/Locale";
import { OsUpdateStateSheet } from "../sheets/OsUpdateStateSheet";
import type { BackupBannerConfirmation } from "./useBackupBannerViewModel";

type BackupConfirmationSheetProps = Readonly<{
  confirmation: BackupBannerConfirmation | null;
  onConfirmRestore: () => void;
  onConfirmDelete: () => void;
  onCancel: () => void;
}>;

export function BackupConfirmationSheet({
  confirmation,
  onConfirmRestore,
  onConfirmDelete,
  onCancel,
}: BackupConfirmationSheetProps) {
  return (
    <>
      <OsUpdateStateSheet isOpen={confirmation === "restore"} onClose={onCancel} hideHeader>
        <InfoState
          preset="spot"
          spotProps={{ icon: Warning }}
          size="hug"
          title={<Trans i18nKey="osUpdates.restoreConfirmation.title" />}
          description={<Trans i18nKey="osUpdates.restoreConfirmation.description" />}
          primaryCta={{
            label: <Trans i18nKey="osUpdates.restoreConfirmation.confirm" />,
            onPress: onConfirmRestore,
            testID: "backup-restore-confirmation-confirm",
          }}
          secondaryCta={{
            label: <Trans i18nKey="osUpdates.restoreConfirmation.cancel" />,
            onPress: onCancel,
            testID: "backup-restore-confirmation-cancel",
          }}
          testID="backup-restore-confirmation"
        />
      </OsUpdateStateSheet>
      <OsUpdateStateSheet isOpen={confirmation === "delete"} onClose={onCancel} hideHeader>
        <InfoState
          preset="spot"
          spotProps={{ icon: Warning }}
          size="hug"
          title={<Trans i18nKey="osUpdates.deleteConfirmation.title" />}
          description={<Trans i18nKey="osUpdates.deleteConfirmation.description" />}
          primaryCta={{
            label: <Trans i18nKey="osUpdates.deleteConfirmation.confirm" />,
            onPress: onConfirmDelete,
            testID: "backup-delete-confirmation-confirm",
          }}
          secondaryCta={{
            label: <Trans i18nKey="osUpdates.deleteConfirmation.cancel" />,
            onPress: onCancel,
            testID: "backup-delete-confirmation-cancel",
          }}
          testID="backup-delete-confirmation"
        />
      </OsUpdateStateSheet>
    </>
  );
}
