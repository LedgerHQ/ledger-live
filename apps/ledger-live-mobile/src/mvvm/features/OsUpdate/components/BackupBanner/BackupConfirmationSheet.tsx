import React, { useState } from "react";
import { Warning } from "@ledgerhq/lumen-ui-rnative/symbols";
import { InfoState } from "@shared/ui-info-state";
import { Trans } from "~/context/Locale";
import { OsUpdateStateSheet } from "../../sheets/OsUpdateStateSheet";
import type { BackupBannerConfirmation } from "./useBackupBannerViewModel";

const CONFIRMATIONS = {
  restore: {
    title: "osUpdates.restoreConfirmation.title",
    description: "osUpdates.restoreConfirmation.description",
    confirm: "osUpdates.restoreConfirmation.confirm",
    cancel: "osUpdates.restoreConfirmation.cancel",
    testID: "backup-restore-confirmation",
  },
  delete: {
    title: "osUpdates.deleteConfirmation.title",
    description: "osUpdates.deleteConfirmation.description",
    confirm: "osUpdates.deleteConfirmation.confirm",
    cancel: "osUpdates.deleteConfirmation.cancel",
    testID: "backup-delete-confirmation",
  },
} as const satisfies Record<BackupBannerConfirmation, Record<string, string>>;

type BackupConfirmationSheetProps = Readonly<{
  confirmation: BackupBannerConfirmation | null;
  onConfirmRestore: () => void;
  onConfirmDelete: () => void;
  onCancel: () => void;
  /** The sheet is closed without a button. */
  onDismiss: () => void;
}>;

export function BackupConfirmationSheet({
  confirmation,
  onConfirmRestore,
  onConfirmDelete,
  onCancel,
  onDismiss,
}: BackupConfirmationSheetProps) {
  const [kind, setKind] = useState(confirmation);
  if (confirmation && confirmation !== kind) setKind(confirmation);
  const content = kind ? CONFIRMATIONS[kind] : null;

  return (
    <OsUpdateStateSheet isOpen={confirmation !== null} onClose={onDismiss} hideHeader>
      {content ? (
        <InfoState
          preset="spot"
          spotProps={{ icon: Warning }}
          size="hug"
          title={<Trans i18nKey={content.title} />}
          description={<Trans i18nKey={content.description} />}
          primaryCta={{
            label: <Trans i18nKey={content.confirm} />,
            onPress: kind === "restore" ? onConfirmRestore : onConfirmDelete,
            testID: `${content.testID}-confirm`,
          }}
          secondaryCta={{
            label: <Trans i18nKey={content.cancel} />,
            onPress: onCancel,
            testID: `${content.testID}-cancel`,
          }}
          testID={content.testID}
        />
      ) : null}
    </OsUpdateStateSheet>
  );
}
