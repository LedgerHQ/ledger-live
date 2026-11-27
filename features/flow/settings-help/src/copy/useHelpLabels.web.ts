import { useMemo } from "react";
import { useTranslation } from "@shared/i18n";
import type { HelpLabels } from "./helpLabels.types";
import { helpRow } from "./helpRow";

/** Reuses the legacy desktop translation keys wherever their wording still fits. */
export function useHelpLabels(): HelpLabels {
  const { t } = useTranslation();

  return useMemo(
    () => ({
      title: t("settings.helpPage.title"),
      groups: {
        supportAndLearning: t("settings.helpPage.groups.supportAndLearning"),
        more: t("settings.helpPage.groups.more"),
      },
      items: {
        support: helpRow(
          t("settings.helpPage.support.title"),
          t("settings.helpPage.support.description"),
        ),
        academy: helpRow(t("help.ledgerAcademy.title"), t("help.ledgerAcademy.desc")),
        saveLogs: helpRow(
          t("settings.exportLogs.title"),
          t("settings.helpPage.saveLogs.description"),
          t("settings.exportLogs.btn"),
        ),
        status: helpRow(t("settings.helpPage.status.title"), t("help.status.desc")),
        clearCache: helpRow(
          t("settings.profile.softResetTitle"),
          t("settings.helpPage.clearCache.description"),
          t("settings.profile.softReset"),
        ),
        viewUserData: helpRow(
          t("settings.openUserDataDirectory.title"),
          t("settings.helpPage.viewUserData.description"),
          t("settings.openUserDataDirectory.btn"),
        ),
        repairDevice: helpRow(
          t("settings.repairDevice.title"),
          t("settings.repairDevice.descSettings"),
          t("settings.repairDevice.button"),
        ),
        launchOnboarding: helpRow(
          t("settings.profile.launchOnboarding"),
          t("settings.profile.launchOnboardingDesc"),
          t("common.launch"),
        ),
        resetApp: helpRow(
          t("settings.profile.hardResetTitle"),
          t("settings.helpPage.resetApp.description"),
          t("common.reset"),
        ),
      },
      confirmations: {
        clearCache: {
          title: t("settings.softResetModal.title"),
          description: t("settings.softResetModal.desc"),
          confirm: t("settings.profile.softReset"),
          cancel: t("common.cancel"),
        },
        resetApp: {
          title: t("settings.hardResetModal.title"),
          description: `${t("settings.hardResetModal.desc")} ${t("settings.hardResetModal.warning")}`,
          confirm: t("common.reset"),
          cancel: t("common.cancel"),
        },
      },
    }),
    [t],
  );
}
