import { useContactsMeContact } from "@features/flow-contacts";
import { useTranslation } from "~/context/Locale";

export type ContactsViewModel = {
  searchPlaceholder: string;
  addContactLabel: string;
  meName: string;
  meAddressCountLabel: string;
};

export function useContactsViewModel(): ContactsViewModel {
  const { t } = useTranslation();
  const meContact = useContactsMeContact();

  return {
    searchPlaceholder: t("contacts.searchPlaceholder"),
    addContactLabel: t("contacts.addContact"),
    meName: meContact?.name ?? t("contacts.me.name"),
    meAddressCountLabel: t("contacts.me.addressCount", {
      count: meContact?.addresses.length ?? 0,
    }),
  };
}
