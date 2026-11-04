import React from "react";
import type { DeviceModelId } from "@ledgerhq/types-devices";
import {
  Box,
  DescriptionItem,
  DescriptionItemLabel,
  DescriptionItemLeading,
  DescriptionItemTrailing,
  DescriptionItemValue,
} from "@ledgerhq/lumen-ui-rnative";
import { InfoState } from "@shared/ui-info-state";
import { Trans } from "~/context/Locale";
import { HistoryIcon } from "../../components/HistoryIcon";
import { useBackupSelectionContentViewModel } from "./useBackupSelectionContentViewModel";

type BackupSelectionContentProps = Readonly<{
  deviceModelId: DeviceModelId;
  backupCreatedAt: Date;
  onUseExisting: () => void;
  onCreateNew: () => void;
}>;

export function BackupSelectionContent({
  deviceModelId,
  backupCreatedAt,
  onUseExisting,
  onCreateNew,
}: BackupSelectionContentProps) {
  const { productName, lastSave } = useBackupSelectionContentViewModel(
    deviceModelId,
    backupCreatedAt,
  );

  return (
    <InfoState
      preset="spot"
      spotProps={{ icon: HistoryIcon }}
      size="hug"
      title={<Trans i18nKey="osUpdates.backupSelection.title" />}
      description={
        <Trans i18nKey="osUpdates.backupSelection.description" values={{ productName }} />
      }
      content={
        <Box
          lx={{ backgroundColor: "muted", borderRadius: "md", padding: "s16" }}
          testID="os-update-backup-selection-last-save"
        >
          <DescriptionItem>
            <DescriptionItemLeading>
              <DescriptionItemLabel>
                <Trans i18nKey="osUpdates.backupSelection.lastSave" />
              </DescriptionItemLabel>
            </DescriptionItemLeading>
            <DescriptionItemTrailing>
              <DescriptionItemValue>
                <Trans i18nKey="osUpdates.backupSelection.lastSaveDate" values={lastSave} />
              </DescriptionItemValue>
            </DescriptionItemTrailing>
          </DescriptionItem>
        </Box>
      }
      primaryCta={{
        label: <Trans i18nKey="osUpdates.backupSelection.createNew" />,
        onPress: onCreateNew,
        testID: "os-update-create-new-backup",
      }}
      secondaryCta={{
        label: <Trans i18nKey="osUpdates.backupSelection.useExisting" />,
        onPress: onUseExisting,
        testID: "os-update-use-existing-backup",
      }}
      testID="os-update-backup-selection"
    />
  );
}
