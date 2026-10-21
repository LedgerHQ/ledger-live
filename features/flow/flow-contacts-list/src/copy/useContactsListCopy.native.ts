import { useMemo } from "react";
import { useTranslation } from "@shared/i18n";

export type ContactsListTitleContext = "contacts" | "selectContact";

export function useContactsListCopy(titleContext: ContactsListTitleContext = "contacts") {
  const { t } = useTranslation();

  return useMemo(() => {
    const title =
      titleContext === "selectContact"
        ? t("send.newSendFlow.addContact.selectContact")
        : t("contacts.title");

    return {
      title,
      searchPlaceholder: t("contacts.searchPlaceholder"),
      searchNoResults: t("contacts.searchNoResults"),
      searchNoResultsDescription: t("contacts.searchNoResultsDescription"),
      addContact: t("contacts.addContact"),
      ledgerSyncCheckingAccessibilityLabel:
        titleContext === "selectContact"
          ? title
          : t("contacts.ledgerSyncIntroduction.checkingAccessibilityLabel"),
      formatAddressCount: (count: number) => t("contacts.addressCount", { count }),
    };
  }, [t, titleContext]);
}
