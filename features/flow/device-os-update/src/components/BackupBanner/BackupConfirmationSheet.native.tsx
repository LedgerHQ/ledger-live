import React, { useState } from "react";
import { WarningFill } from "@ledgerhq/lumen-ui-rnative/symbols";
import { InfoState } from "@shared/ui-info-state";
import { Trans } from "@shared/i18n";
import { OsUpdateStateSheet } from "../sheets/OsUpdateStateSheet/OsUpdateStateSheet";
import type { BackupBannerConfirmation } from "./useBackupBannerViewModel";

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

  return (
    <OsUpdateStateSheet isOpen={confirmation !== null} onClose={onDismiss} hideHeader>
      {kind ? (
        <ConfirmationContent
          kind={kind}
          onConfirm={kind === "restore" ? onConfirmRestore : onConfirmDelete}
          onCancel={onCancel}
        />
      ) : null}
    </OsUpdateStateSheet>
  );
}

function ConfirmationContent({
  kind,
  onConfirm,
  onCancel,
}: Readonly<{ kind: BackupBannerConfirmation; onConfirm: () => void; onCancel: () => void }>) {
  return (
    <InfoState
      preset="spot"
      spotProps={{ icon: WarningFill, appearance: "warning" }}
      size="hug"
      title={<Trans i18nKey={`osUpdates.${kind}Confirmation.title`} />}
      description={<Trans i18nKey={`osUpdates.${kind}Confirmation.description`} />}
      primaryCta={{
        label: <Trans i18nKey={`osUpdates.${kind}Confirmation.confirm`} />,
        onPress: onConfirm,
        testID: `backup-${kind}-confirmation-confirm`,
      }}
      secondaryCta={{
        label: <Trans i18nKey={`osUpdates.${kind}Confirmation.cancel`} />,
        onPress: onCancel,
        testID: `backup-${kind}-confirmation-cancel`,
      }}
      testID={`backup-${kind}-confirmation`}
    />
  );
}
