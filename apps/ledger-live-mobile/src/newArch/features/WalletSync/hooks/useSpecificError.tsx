import React from "react";
import { Icons } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components/native";
import { AnalyticsButton, AnalyticsPage, useLedgerSyncAnalytics } from "./useLedgerSyncAnalytics";

import { ButtonProps } from "@ledgerhq/native-ui/components/cta/Button";

export enum ErrorReason {
  UNSECURED = "unsecured",
  AUTO_REMOVE = "auto-remove",
  SAME_SEED = "same",
  OTHER_SEED = "other",
  ALREADY_BACKED_SCAN = "already-backed",
  DIFFERENT_BACKUPS = "different-backups",
  NO_BACKUP = "no-backup",
}

export interface ErrorConfig {
  icon: React.ReactNode;
  title: string;
  description?: string;
  info?: string;
  cta: string;
  ctaSecondary?: string;
  analyticsPage: AnalyticsPage;
  buttonType: ButtonProps["type"];
  outline?: boolean;
  primaryAction: () => void;
  secondaryAction?: () => void;
}

export type SpecificProps = {
  primaryAction: () => void;
  secondaryAction?: () => void;
};

export function useSpecificError({ primaryAction, secondaryAction }: SpecificProps) {
  const { onClickTrack } = useLedgerSyncAnalytics();
  const { t } = useTranslation();
  const { colors } = useTheme();

  const onTryAgain = (page: AnalyticsPage) => {
    onClickTrack({ button: AnalyticsButton.UseAnother, page });
  };
  const onGoToDelete = (page: AnalyticsPage) => {
    onClickTrack({ button: AnalyticsButton.DeleteKey, page });
  };

  const onUnderstood = (page: AnalyticsPage) => {
    onClickTrack({ button: AnalyticsButton.Understand, page });
  };

  const onCancel = (page: AnalyticsPage) => {
    onClickTrack({ button: AnalyticsButton.Cancel, page });
  };

  const onCreate = (page: AnalyticsPage) => {
    onClickTrack({ button: AnalyticsButton.CreateYourKey, page });
  };

  const errorConfig: Record<ErrorReason, ErrorConfig> = {
    [ErrorReason.UNSECURED]: {
      icon: <Icons.DeleteCircleFill size={"L"} color={colors.error.c60} />,
      title: t("walletSync.walletSyncActivated.synchronizedInstances.unsecuredError.title"),
      description: t(
        "walletSync.walletSyncActivated.synchronizedInstances.unsecuredError.description",
      ),
      info: t("walletSync.walletSyncActivated.synchronizedInstances.unsecuredError.info"),
      cta: t("walletSync.walletSyncActivated.synchronizedInstances.unsecuredError.cta"),
      ctaSecondary: t(
        "walletSync.walletSyncActivated.synchronizedInstances.unsecuredError.ctaDelete",
      ),
      analyticsPage: AnalyticsPage.RemoveInstanceWrongDevice,
      buttonType: "main" as ButtonProps["type"],
      primaryAction: () => {
        primaryAction();
        onTryAgain(AnalyticsPage.RemoveInstanceWrongDevice);
      },
      secondaryAction: () => {
        secondaryAction?.();
        onGoToDelete(AnalyticsPage.RemoveInstanceWrongDevice);
      },
    },
    [ErrorReason.AUTO_REMOVE]: {
      icon: <Icons.InformationFill size={"L"} color={colors.primary.c80} />,
      title: t("walletSync.walletSyncActivated.synchronizedInstances.autoRemoveError.title"),
      description: t(
        "walletSync.walletSyncActivated.synchronizedInstances.autoRemoveError.description",
      ),
      info: t("walletSync.walletSyncActivated.synchronizedInstances.autoRemoveError.info"),
      cta: t("walletSync.walletSyncActivated.synchronizedInstances.autoRemoveError.cta"),
      ctaSecondary: t(
        "walletSync.walletSyncActivated.synchronizedInstances.autoRemoveError.ctaDelete",
      ),
      analyticsPage: AnalyticsPage.AutoRemove,
      buttonType: "main" as ButtonProps["type"],
      primaryAction: () => {
        primaryAction();
        onUnderstood(AnalyticsPage.AutoRemove);
      },
      secondaryAction: () => {
        secondaryAction?.();
        onGoToDelete(AnalyticsPage.AutoRemove);
      },
    },
    [ErrorReason.SAME_SEED]: {
      icon: <Icons.InformationFill size={"L"} color={colors.primary.c80} />,
      title: t("walletSync.synchronize.alreadySecureError.title"),
      description: t("walletSync.synchronize.alreadySecureError.description"),
      cta: t("walletSync.synchronize.alreadySecureError.cta"),

      analyticsPage: AnalyticsPage.SameSeed,
      buttonType: "main" as ButtonProps["type"],
      primaryAction: () => {
        primaryAction();
        onUnderstood(AnalyticsPage.SameSeed);
      },
    },
    [ErrorReason.OTHER_SEED]: {
      icon: <Icons.DeleteCircleFill size={"L"} color={colors.error.c60} />,
      title: t("walletSync.synchronize.alreadySecureOtherSeedError.title"),
      description: t("walletSync.synchronize.alreadySecureOtherSeedError.description"),
      cta: t("walletSync.synchronize.alreadySecureOtherSeedError.cta"),
      ctaSecondary: t("common.cancel"),
      analyticsPage: AnalyticsPage.OtherSeed,
      buttonType: "main" as ButtonProps["type"],
      outline: true,
      primaryAction: () => {
        primaryAction();
        onGoToDelete(AnalyticsPage.OtherSeed);
      },
      secondaryAction: () => {
        secondaryAction?.();
        onCancel(AnalyticsPage.OtherSeed);
      },
    },
    [ErrorReason.ALREADY_BACKED_SCAN]: {
      icon: <Icons.InformationFill size={"L"} color={colors.primary.c80} />,
      title: t("walletSync.synchronize.qrCode.alreadyBacked.title"),
      cta: t("walletSync.synchronize.qrCode.alreadyBacked.cta"),
      analyticsPage: AnalyticsPage.ScanAttemptWithSameBackup,
      buttonType: "main" as ButtonProps["type"],
      primaryAction: () => {
        primaryAction();
        onUnderstood(AnalyticsPage.ScanAttemptWithSameBackup);
      },
    },
    [ErrorReason.DIFFERENT_BACKUPS]: {
      icon: <Icons.DeleteCircleFill size={"L"} color={colors.error.c60} />,
      title: t("walletSync.synchronize.qrCode.backedWithDifferentSeeds.title"),
      description: t("walletSync.synchronize.qrCode.backedWithDifferentSeeds.description"),
      cta: t("walletSync.synchronize.qrCode.backedWithDifferentSeeds.cta"),
      analyticsPage: AnalyticsPage.ScanAttemptWithDifferentBackups,
      buttonType: "main" as ButtonProps["type"],

      primaryAction: () => {
        primaryAction();
        onGoToDelete(AnalyticsPage.ScanAttemptWithDifferentBackups);
      },
    },
    [ErrorReason.NO_BACKUP]: {
      icon: <Icons.DeleteCircleFill size={"L"} color={colors.error.c60} />,
      title: t("walletSync.synchronize.qrCode.unbacked.title"),
      description: t("walletSync.synchronize.qrCode.unbacked.description"),
      cta: t("walletSync.synchronize.qrCode.unbacked.cta"),
      analyticsPage: AnalyticsPage.Unbacked,
      buttonType: "main" as ButtonProps["type"],

      primaryAction: () => {
        primaryAction();
        onCreate(AnalyticsPage.Unbacked);
      },
    },
  };

  const getErrorConfig = (error: ErrorReason) => errorConfig[error];

  return {
    getErrorConfig,
    onCancel,
    onGoToDelete,
    onTryAgain,
    onUnderstood,
  };
}
