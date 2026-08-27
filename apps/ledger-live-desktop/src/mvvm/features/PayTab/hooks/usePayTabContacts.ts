import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { ContactsProps } from "@features/flow-pay-contact";

export function usePayTabContacts(): ContactsProps {
  const { t } = useTranslation();

  const onAddContact = useCallback(() => undefined, []);

  return useMemo(
    () => ({
      title: t("payTab.contacts.title"),
      emptyState: {
        info: t("payTab.contacts.empty.info"),
        addContactLabel: t("payTab.contacts.empty.addContact"),
        onAddContact,
      },
    }),
    [t, onAddContact],
  );
}
