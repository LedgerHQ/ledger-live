import { useTranslation } from "react-i18next";
import { useContactsMeContact } from "@features/flow-contacts/hooks";

export type ContactsViewModel = {
  title: string;
  addContactLabel: string;
  meName: string;
  meAddressCountLabel: string;
};

export function useContactsViewModel(): ContactsViewModel {
  const { t } = useTranslation();
  const meContact = useContactsMeContact();

  return {
    title: t("contacts.title"),
    addContactLabel: t("contacts.addContact"),
    meName: meContact?.name ?? t("contacts.me.name"),
    meAddressCountLabel: t("contacts.me.addressCount", {
      count: meContact?.addresses.length ?? 0,
    }),
  };
}
