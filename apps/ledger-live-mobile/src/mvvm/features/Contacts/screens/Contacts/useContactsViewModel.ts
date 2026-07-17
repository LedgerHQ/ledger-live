import {
  createEmptyContactsListViewModel,
  type ContactsPageLabels,
  type ContactsPageProps,
  useContactsMeContact,
} from "@features/flow-contacts";
import { useCallback, useMemo } from "react";
import { MY_WALLET_AVATAR_USER_URL } from "LLM/features/MyWallet/components/UserAvatar/constants";
import { useTranslation } from "~/context/Locale";

export type ContactsViewModel = ContactsPageProps;

export function useContactsViewModel(): ContactsViewModel {
  const { t } = useTranslation();
  const meContact = useContactsMeContact();
  const labels = useMemo<ContactsPageLabels>(
    () => ({
      title: t("contacts.title"),
      searchPlaceholder: t("contacts.searchPlaceholder"),
      addContact: t("contacts.addContact"),
      formatAddressCount: count => t("contacts.me.addressCount", { count }),
    }),
    [t],
  );
  const viewModel = useMemo(() => createEmptyContactsListViewModel(meContact!), [meContact]);
  const onOpenMe = useCallback(() => undefined, []);
  const onAddContact = useCallback(() => undefined, []);

  return {
    viewModel,
    labels,
    meAvatarSrc: MY_WALLET_AVATAR_USER_URL,
    onOpenMe,
    onAddContact,
  };
}
