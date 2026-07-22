import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import {
  CONTACTS_FEATURE_INTRODUCTION_HIGHLIGHTS,
  createContactsListViewModel,
  createContactsSearchViewModel,
  resolveContactsLedgerSyncIntroductionOpen,
  useContacts,
  useContactsFeatureIntroductionState,
  useContactsMeContact,
  type ContactsLedgerSyncStatus,
  type ContactsPageLabels,
} from "@features/flow-contacts";
import { MY_WALLET_AVATAR_USER_URL } from "LLD/features/MyWallet/components/UserAvatar/constants";
import { useContactsFeatureIntroductionPreference } from "../../hooks/useContactsFeatureIntroductionPreference";
import type { ContactsViewProps } from "./ContactsView";

export type ContactsViewModel = ContactsViewProps;

export function useContactsViewModel(): ContactsViewModel {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const meContact = useContactsMeContact();
  const contacts = useContacts();
  const [isLedgerSyncIntroductionDismissed, setIsLedgerSyncIntroductionDismissed] = useState(false);
  const [ledgerSyncStatus] = useState<ContactsLedgerSyncStatus>("ready");
  const preference = useContactsFeatureIntroductionPreference();
  const featureIntroductionState = useContactsFeatureIntroductionState({
    isContactsEntryAvailable: true,
    preference,
  });
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
  const featureIntroductionHighlights = useMemo(
    () =>
      CONTACTS_FEATURE_INTRODUCTION_HIGHLIGHTS.map(({ icon, translationKey }) => ({
        icon,
        title: t(`contacts.featureIntroduction.highlights.${translationKey}.title`),
        description: t(`contacts.featureIntroduction.highlights.${translationKey}.description`),
      })),
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
  const onDismissLedgerSyncIntroduction = useCallback(
    () => setIsLedgerSyncIntroductionDismissed(true),
    [],
  );

  useEffect(() => {
    if (ledgerSyncStatus !== "inactive") {
      setIsLedgerSyncIntroductionDismissed(false);
    }
  }, [ledgerSyncStatus]);

  const isLedgerSyncIntroductionOpen = resolveContactsLedgerSyncIntroductionOpen({
    isFeatureIntroductionRequested: featureIntroductionState.isRequested,
    ledgerSyncStatus,
    isLedgerSyncIntroductionDismissed,
  });

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
    featureIntroduction: {
      isOpen: featureIntroductionState.isRequested,
      title: t("contacts.featureIntroduction.title"),
      description: t("contacts.featureIntroduction.description"),
      highlights: featureIntroductionHighlights,
      primaryActionLabel: t("contacts.featureIntroduction.primaryAction"),
      secondaryActionLabel: t("contacts.featureIntroduction.secondaryAction"),
      onDismiss: featureIntroductionState.dismiss,
    },
    ledgerSyncIntroduction: {
      isOpen: isLedgerSyncIntroductionOpen,
      description: t("contacts.ledgerSyncIntroduction.description"),
      dismissLabel: t("contacts.ledgerSyncIntroduction.dismiss"),
      onDismiss: onDismissLedgerSyncIntroduction,
    },
  };
}
