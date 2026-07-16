import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  createEmptyContactsListViewModel,
  useContactsMeContact,
  type ContactsLedgerSyncStatus,
  type ContactsPageLabels,
} from "@features/flow-contacts";
import { MY_WALLET_AVATAR_USER_URL } from "LLD/features/MyWallet/components/UserAvatar/constants";
import type { ContactsViewProps } from "./ContactsView";

export type ContactsViewModel = ContactsViewProps;

export function useContactsViewModel(): ContactsViewModel {
  const { t } = useTranslation();
  const meContact = useContactsMeContact();
  const [isIntroductionOpen, setIsIntroductionOpen] = useState(false);
  const ledgerSyncStatus: ContactsLedgerSyncStatus = "ready";
  const labels = useMemo<ContactsPageLabels>(
    () => ({
      title: t("contacts.title"),
      searchPlaceholder: t("contacts.searchPlaceholder"),
      addContact: t("contacts.addContact"),
      formatAddressCount: count => t("contacts.me.addressCount", { count }),
    }),
    [t],
  );
  const onOpenMe = useCallback<ContactsViewProps["onOpenMe"]>(_contactId => undefined, []);
  const onAddContact = useCallback(() => undefined, []);
  const onDismissIntroduction = useCallback(() => setIsIntroductionOpen(false), []);

  return {
    viewModel: createEmptyContactsListViewModel(meContact),
    labels,
    meAvatarSrc: MY_WALLET_AVATAR_USER_URL,
    onOpenMe,
    onAddContact,
    ledgerSyncStatus,
    ledgerSyncIntroduction: {
      isOpen: isIntroductionOpen,
      description: t("contacts.ledgerSyncIntroduction.description"),
      dismissLabel: t("contacts.ledgerSyncIntroduction.dismiss"),
      onDismiss: onDismissIntroduction,
    },
  };
}
