import { useMemo } from "react";
import { useTranslation } from "@shared/i18n";
import type { HelpLabels } from "./helpLabels.types";
import { helpRow } from "./helpRow";

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
        support: helpRow(
          t("myWallet.help.rows.ledgerSupport.title"),
          t("myWallet.help.rows.ledgerSupport.description"),
        ),
        academy: helpRow(
          t("myWallet.help.rows.ledgerAcademy.title"),
          t("myWallet.help.rows.ledgerAcademy.description"),
        ),
        saveLogs: helpRow(
          t("myWallet.help.rows.saveLogs.title"),
          t("myWallet.help.rows.saveLogs.description"),
        ),
        status: helpRow(
          t("myWallet.help.rows.ledgerStatus.title"),
          t("myWallet.help.rows.ledgerStatus.description"),
        ),
        clearCache: helpRow(
          t("myWallet.help.rows.clearCache.title"),
          t("myWallet.help.rows.clearCache.description"),
        ),
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
