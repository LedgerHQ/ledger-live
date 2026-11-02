import React from "react";
import { InfoState } from "@shared/ui-info-state";
import { Trans } from "~/context/Locale";

type BackupSelectionContentProps = Readonly<{
  onUseExisting: () => void;
  onCreateNew: () => void;
}>;

export function BackupSelectionContent({
  onUseExisting,
  onCreateNew,
}: BackupSelectionContentProps) {
  return (
    <InfoState
      preset="info"
      size="hug"
      title={<Trans i18nKey="osUpdates.backupSelection.title" />}
      description={<Trans i18nKey="osUpdates.backupSelection.description" />}
      primaryCta={{
        label: <Trans i18nKey="osUpdates.backupSelection.useExisting" />,
        onPress: onUseExisting,
        testID: "os-update-use-existing-backup",
      }}
      secondaryCta={{
        label: <Trans i18nKey="osUpdates.backupSelection.createNew" />,
        onPress: onCreateNew,
        testID: "os-update-create-new-backup",
      }}
      testID="os-update-backup-selection"
    />
  );
}
