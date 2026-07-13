import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  createEmptyContactsListViewModel,
  useContactsMeContact,
  type ContactsEmptyListLabels,
} from "@features/flow-contacts";
import { MY_WALLET_AVATAR_USER_URL } from "LLD/features/MyWallet/components/UserAvatar/useUserAvatarViewModel";
import type { ContactsViewProps } from "./ContactsView";

export type ContactsViewModel = ContactsViewProps | undefined;

export function useContactsViewModel(): ContactsViewModel {
  const { t } = useTranslation();
  const meContact = useContactsMeContact();
  const labels = useMemo<ContactsEmptyListLabels>(
    () => ({
      title: t("contacts.title"),
      searchPlaceholder: t("contacts.searchPlaceholder"),
      addContact: t("contacts.addContact"),
      formatAddressCount: count => t("contacts.me.addressCount", { count }),
    }),
    [t],
  );
  const onOpenMe = useCallback(() => undefined, []);
  const onAddContact = useCallback(() => undefined, []);

  if (!meContact) {
    return undefined;
  }

  return {
    viewModel: createEmptyContactsListViewModel(meContact),
    labels,
    meAvatarSrc: MY_WALLET_AVATAR_USER_URL,
    onOpenMe,
    onAddContact,
  };
}
