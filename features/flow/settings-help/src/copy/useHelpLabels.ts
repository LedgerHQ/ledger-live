import { useMemo } from "react";
import type { SettingsConfirmSheetLabels } from "@features/flow-settings";
import { useTranslation } from "@shared/i18n";
import type { HelpGroupId, HelpItemId } from "../logic/helpItems";

export type HelpRowLabels = Readonly<{ title: string; description: string; action?: string }>;

export type HelpConfirmId = "clearCache" | "resetApp";

export type HelpLabels = Readonly<{
  title: string;
  groups: Readonly<Record<HelpGroupId, string>>;
  items: Readonly<Record<HelpItemId, HelpRowLabels>>;
  confirmations: Readonly<Record<HelpConfirmId, SettingsConfirmSheetLabels>>;
}>;

/** Reuses the legacy translation keys wherever their wording still fits. */
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
        support: {
          title: t("settings.helpPage.support.title"),
          description: t("settings.helpPage.support.description"),
        },
        academy: {
          title: t("help.ledgerAcademy.title"),
          description: t("help.ledgerAcademy.desc"),
        },
        saveLogs: {
          title: t("settings.exportLogs.title"),
          description: t("settings.helpPage.saveLogs.description"),
          action: t("settings.exportLogs.btn"),
        },
        status: {
          title: t("settings.helpPage.status.title"),
          description: t("help.status.desc"),
        },
        clearCache: {
          title: t("settings.profile.softResetTitle"),
          description: t("settings.helpPage.clearCache.description"),
          action: t("settings.profile.softReset"),
        },
        viewUserData: {
          title: t("settings.openUserDataDirectory.title"),
          description: t("settings.helpPage.viewUserData.description"),
          action: t("settings.openUserDataDirectory.btn"),
        },
        troubleshootNetwork: {
          title: t("settings.troubleshootNetwork.title"),
          description: t("settings.troubleshootNetwork.desc"),
          action: t("settings.troubleshootNetwork.btn"),
        },
        repairDevice: {
          title: t("settings.repairDevice.title"),
          description: t("settings.repairDevice.descSettings"),
          action: t("settings.repairDevice.button"),
        },
        launchOnboarding: {
          title: t("settings.profile.launchOnboarding"),
          description: t("settings.profile.launchOnboardingDesc"),
          action: t("common.launch"),
        },
        resetApp: {
          title: t("settings.profile.hardResetTitle"),
          description: t("settings.helpPage.resetApp.description"),
          action: t("common.reset"),
        },
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
