import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import {
  createContactsListViewModel,
  createContactsSearchViewModel,
  useContacts,
  useContactsMeContact,
  type ContactsLedgerSyncStatus,
  type ContactsPageLabels,
} from "@features/flow-contacts";
import { MY_WALLET_AVATAR_USER_URL } from "LLD/features/MyWallet/components/UserAvatar/constants";
import type { ContactsViewProps } from "./ContactsView";

export type ContactsViewModel = ContactsViewProps;

export function useContactsViewModel(): ContactsViewModel {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const meContact = useContactsMeContact();
  const contacts = useContacts();
  const [isIntroductionDismissed, setIsIntroductionDismissed] = useState(false);
  const [ledgerSyncStatus] = useState<ContactsLedgerSyncStatus>("ready");
  const labels = useMemo<ContactsPageLabels>(
    () => ({
      title: t("contacts.title"),
      searchPlaceholder: t("contacts.searchPlaceholder"),
      searchNoResults: t("contacts.searchNoResults"),
      addContact: t("contacts.addContact"),
      formatAddressCount: count => t("contacts.me.addressCount", { count }),
    }),
    [t],
  );
  const viewModel = useMemo(() => {
    if (searchQuery.trim().length > 0) {
      return createContactsSearchViewModel(meContact, contacts, searchQuery);
    }

    return createContactsListViewModel(meContact, contacts);
  }, [contacts, meContact, searchQuery]);
  const onSearchInputChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  }, []);
  const onOpenMe = useCallback<ContactsViewProps["onOpenMe"]>(_contactId => undefined, []);
  const onOpenContact = useCallback<ContactsViewProps["onOpenContact"]>(
    _contactId => undefined,
    [],
  );
  const onAddContact = useCallback(() => undefined, []);
  const onDismissIntroduction = useCallback(() => setIsIntroductionDismissed(true), []);

  useEffect(() => {
    if (ledgerSyncStatus !== "inactive") {
      setIsIntroductionDismissed(false);
    }
  }, [ledgerSyncStatus]);

  const isIntroductionOpen = ledgerSyncStatus === "inactive" && !isIntroductionDismissed;

  return {
    viewModel,
    labels,
    searchQuery,
    meAvatarSrc: MY_WALLET_AVATAR_USER_URL,
    onSearchInputChange,
    onOpenMe,
    onOpenContact,
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
