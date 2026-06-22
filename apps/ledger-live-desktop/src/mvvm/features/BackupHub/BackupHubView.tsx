import React from "react";
import { useTranslation } from "react-i18next";
import { IconButton } from "@ledgerhq/lumen-ui-react";
import { ArrowLeft } from "@ledgerhq/lumen-ui-react/symbols";
import { LedgerRecoverRow } from "./components/LedgerRecoverRow";
import { PhysicalBackupRow } from "./components/PhysicalBackupRow";
import type { BackupBucket, PhysicalRowId } from "./types";
import type { BackupHubViewModel } from "./useBackupHubViewModel";

export type BackupHubViewProps = BackupHubViewModel;

const RECOVER_ROW_BY_BUCKET: Record<
  BackupBucket,
  { descriptionKey: string; showCta: boolean; isWarning: boolean; showNotificationDot: boolean }
> = {
  "not-subscribed": {
    descriptionKey: "myWallet.backupHub.recover.notSubscribed",
    showCta: true,
    isWarning: false,
    showNotificationDot: true,
  },
  "in-progress": {
    descriptionKey: "myWallet.backupHub.recover.inProgress",
    showCta: false,
    isWarning: true,
    showNotificationDot: true,
  },
  done: {
    descriptionKey: "myWallet.backupHub.recover.done",
    showCta: false,
    isWarning: false,
    showNotificationDot: false,
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

export function BackupHubView({
  bucket,
  onBack,
  onRecoverClick,
  physicalRows,
}: Readonly<BackupHubViewProps>) {
  const { t } = useTranslation();

  const recoverRow = RECOVER_ROW_BY_BUCKET[bucket];

  return (
    <div className="flex flex-col gap-24" data-testid="backup-hub">
      <div className="relative flex items-center justify-center">
        <IconButton
          appearance="no-background"
          size="sm"
          icon={ArrowLeft}
          aria-label={t("myWallet.backupHub.back")}
          onClick={onBack}
          data-testid="backup-hub-back"
          className="absolute left-0"
        />
        <span className="heading-4-semi-bold text-base">{t("myWallet.backupHub.title")}</span>
      </div>

      <p className="body-2 text-muted">{t("myWallet.backupHub.description")}</p>

      <div className="flex flex-col gap-12">
        <span className="heading-5-semi-bold text-base">
          {t("myWallet.backupHub.sections.digital")}
        </span>
        <LedgerRecoverRow
          showCta={recoverRow.showCta}
          isWarning={recoverRow.isWarning}
          showNotificationDot={recoverRow.showNotificationDot}
          title={t("myWallet.backupHub.recover.title")}
          description={t(recoverRow.descriptionKey)}
          ctaLabel={t("myWallet.backupHub.recover.discover")}
          onClick={onRecoverClick}
        />
      </div>

      <div className="flex flex-col gap-12">
        <span className="heading-5-semi-bold text-base">
          {t("myWallet.backupHub.sections.physical")}
        </span>
        <div className="flex flex-col overflow-hidden rounded-md bg-surface">
          {physicalRows.map(({ id, image, onClick }) => (
            <PhysicalBackupRow
              key={id}
              image={image}
              title={t(PHYSICAL_ROW_I18N[id].titleKey)}
              description={t(PHYSICAL_ROW_I18N[id].descriptionKey)}
              onClick={onClick}
              testId={`backup-hub-physical-row-${id}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
