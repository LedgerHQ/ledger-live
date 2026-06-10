import React from "react";
import { ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Box, Subheader, SubheaderRow, SubheaderTitle, Text } from "@ledgerhq/lumen-ui-rnative";
import { useTranslation } from "~/context/Locale";
import { TrackScreen } from "~/analytics";
import { LedgerRecoverRow } from "../../components/LedgerRecoverRow";
import { PhysicalBackupRow } from "../../components/PhysicalBackupRow";
import { CompareBackupMethodsFooter } from "../../components/CompareBackupMethodsFooter";
import { BACKUP_HUB_TRACKING_PAGE_NAME } from "../../constants";
import type { BackupBucket, PhysicalRowId } from "../../types";
import type { BackupHubScreenViewModel } from "./useBackupHubScreenViewModel";

const RECOVER_ROW_BY_BUCKET: Record<
  BackupBucket,
  { descriptionKey: string; showCta: boolean; isWarning: boolean }
> = {
  "not-subscribed": {
    descriptionKey: "myWallet.backupHub.recover.notSubscribed",
    showCta: true,
    isWarning: false,
  },
  "in-progress": {
    descriptionKey: "myWallet.backupHub.recover.inProgress",
    showCta: false,
    isWarning: true,
  },
  done: {
    descriptionKey: "myWallet.backupHub.recover.done",
    showCta: false,
    isWarning: false,
  },
};

const PHYSICAL_ROW_I18N: Record<PhysicalRowId, { titleKey: string; descriptionKey: string }> = {
  "recovery-key": {
    titleKey: "myWallet.backupHub.recoveryKey.title",
    descriptionKey: "myWallet.backupHub.recoveryKey.description",
  },
  "secret-recovery-phrase": {
    titleKey: "myWallet.backupHub.secretRecoveryPhrase.title",
    descriptionKey: "myWallet.backupHub.secretRecoveryPhrase.description",
  },
};

export function BackupHubScreenView({
  bucket,
  onRecoverPress,
  onComparePress,
  physicalRows,
}: BackupHubScreenViewModel) {
  const { t } = useTranslation();
  const { bottom: bottomInset } = useSafeAreaInsets();

  const recoverRow = RECOVER_ROW_BY_BUCKET[bucket];

  return (
    <Box lx={{ flex: 1 }} testID="backup-hub">
      <TrackScreen category={BACKUP_HUB_TRACKING_PAGE_NAME} />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <Box lx={{ paddingHorizontal: "s16", gap: "s24" }}>
          <Box lx={{ gap: "s8", marginBottom: "s8" }}>
            <Text typography="heading3SemiBold" lx={{ color: "base" }}>
              {t("myWallet.backupHub.title")}
            </Text>
            <Text typography="body2" lx={{ color: "muted" }}>
              {t("myWallet.backupHub.description")}
            </Text>
          </Box>

          <Box lx={{ gap: "s8" }}>
            <Subheader>
              <SubheaderRow testID="backup-hub-section-digital">
                <SubheaderTitle>{t("myWallet.backupHub.sections.digital")}</SubheaderTitle>
              </SubheaderRow>
            </Subheader>
            <Box lx={{ backgroundColor: "surface", borderRadius: "lg", overflow: "hidden" }}>
              <LedgerRecoverRow
                showCta={recoverRow.showCta}
                isWarning={recoverRow.isWarning}
                title={t("myWallet.backupHub.recover.title")}
                description={t(recoverRow.descriptionKey)}
                ctaLabel={t("myWallet.backupHub.recover.discover")}
                onPress={onRecoverPress}
              />
            </Box>
          </Box>

          <Box lx={{ gap: "s8" }}>
            <Subheader>
              <SubheaderRow testID="backup-hub-section-physical">
                <SubheaderTitle>{t("myWallet.backupHub.sections.physical")}</SubheaderTitle>
              </SubheaderRow>
            </Subheader>
            <Box lx={{ backgroundColor: "surface", borderRadius: "lg", overflow: "hidden" }}>
              {physicalRows.map(({ id, image, onPress }) => (
                <PhysicalBackupRow
                  key={id}
                  image={image}
                  title={t(PHYSICAL_ROW_I18N[id].titleKey)}
                  description={t(PHYSICAL_ROW_I18N[id].descriptionKey)}
                  onPress={onPress}
                  testID={`backup-hub-physical-row-${id}`}
                />
              ))}
            </Box>
          </Box>
        </Box>
      </ScrollView>

      <Box
        lx={{ paddingHorizontal: "s16", paddingTop: "s8", alignItems: "center" }}
        style={{ paddingBottom: bottomInset + 4 }}
      >
        <CompareBackupMethodsFooter
          label={t("myWallet.backupHub.compareFooter")}
          onPress={onComparePress}
        />
      </Box>
    </Box>
  );
}
