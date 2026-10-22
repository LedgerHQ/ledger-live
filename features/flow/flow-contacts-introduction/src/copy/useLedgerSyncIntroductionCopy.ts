import { useMemo } from "react";
import { useTranslation } from "@shared/i18n";

export function useLedgerSyncIntroductionCopy() {
  const { t } = useTranslation();

  return useMemo(
    () => ({
      title: t("contacts.ledgerSyncIntroduction.title"),
      description: t("contacts.ledgerSyncIntroduction.description"),
      activateLabel: t("contacts.ledgerSyncIntroduction.activate"),
      dismissLabel: t("contacts.ledgerSyncIntroduction.dismiss"),
    }),
    [t],
  );
}
