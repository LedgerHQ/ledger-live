import { useMemo } from "react";
import { useTranslation } from "@shared/i18n";
import type { HelpLabels } from "./helpLabels.types";

/** Reuses the translation keys of My Wallet Help and of the legacy clear cache drawer. */
export function useHelpLabels(): HelpLabels {
  const { t } = useTranslation();

  return useMemo(
    () => ({
      title: t("myWallet.help.title"),
      groups: {
        supportAndLearning: t("myWallet.help.sections.supportAndLearning"),
        more: t("myWallet.help.sections.more"),
      },
      items: {
        support: {
          title: t("myWallet.help.rows.ledgerSupport.title"),
          description: t("myWallet.help.rows.ledgerSupport.description"),
        },
        academy: {
          title: t("myWallet.help.rows.ledgerAcademy.title"),
          description: t("myWallet.help.rows.ledgerAcademy.description"),
        },
        saveLogs: {
          title: t("myWallet.help.rows.saveLogs.title"),
          description: t("myWallet.help.rows.saveLogs.description"),
        },
        status: {
          title: t("myWallet.help.rows.ledgerStatus.title"),
          description: t("myWallet.help.rows.ledgerStatus.description"),
        },
        clearCache: {
          title: t("myWallet.help.rows.clearCache.title"),
          description: t("myWallet.help.rows.clearCache.description"),
        },
      },
      confirmations: {
        clearCache: {
          title: t("settings.help.clearCache"),
          description: t("settings.help.clearCacheModalDesc"),
          confirm: t("settings.help.clearCacheButton"),
          cancel: t("common.cancel"),
        },
      },
      chatbotSupportTitle: t("help.chatbot"),
    }),
    [t],
  );
}
