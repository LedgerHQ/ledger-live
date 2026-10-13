import React from "react";
import { Box, Button, Text } from "@ledgerhq/lumen-ui-rnative";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { useTranslation } from "~/context/Locale";
import { BackupConfirmationSheet } from "./BackupConfirmationSheet";
import { useBackupBannerViewModel } from "./useBackupBannerViewModel";

type BackupBannerProps = Readonly<{ device: Device }>;

export function BackupBanner({ device }: BackupBannerProps) {
  const { t } = useTranslation();
  const {
    isVisible,
    confirmation,
    onRestore,
    onDelete,
    onCancelConfirmation,
    onConfirmRestore,
    onConfirmDelete,
  } = useBackupBannerViewModel(device);

  if (!isVisible) return null;

  return (
    <>
      <Box
        testID="backup-banner"
        lx={{
          flexDirection: "column",
          gap: "s12",
          backgroundColor: "accent",
          borderRadius: "xl",
          padding: "s16",
        }}
      >
        <Box lx={{ flexDirection: "column", alignItems: "flex-start" }}>
          <Text typography="heading5SemiBold" lx={{ color: "black" }}>
            {t("osUpdates.backupBanner.title")}
          </Text>
          <Text typography="body2" lx={{ color: "black" }}>
            {t("osUpdates.backupBanner.description")}
          </Text>
        </Box>
        <Box lx={{ flexDirection: "row", gap: "s8" }}>
          <Button appearance="gray" size="sm" onPress={onRestore} testID="backup-banner-restore">
            {t("osUpdates.backupBanner.restore")}
          </Button>
          <Button
            appearance="transparent"
            size="sm"
            onPress={onDelete}
            testID="backup-banner-delete"
          >
            {t("osUpdates.backupBanner.delete")}
          </Button>
        </Box>
      </Box>
      <BackupConfirmationSheet
        confirmation={confirmation}
        onConfirmRestore={onConfirmRestore}
        onConfirmDelete={onConfirmDelete}
        onCancel={onCancelConfirmation}
      />
    </>
  );
}
