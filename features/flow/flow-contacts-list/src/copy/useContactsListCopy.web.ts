import { useMemo } from "react";
import { useTranslation } from "@shared/i18n";

export function useContactsListCopy() {
  const { t } = useTranslation();

  return useMemo(
    () => ({
      title: t("contacts.title"),
      searchPlaceholder: t("contacts.searchPlaceholder"),
      searchNoResults: t("contacts.searchNoResults"),
      addContact: t("contacts.addContact"),
      formatAddressCount: (count: number) => t("contacts.addressCount", { count }),
    }),
    [t],
  );
}
