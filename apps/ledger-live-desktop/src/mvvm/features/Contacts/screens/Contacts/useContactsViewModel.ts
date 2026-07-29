import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import type { ContactId } from "@domain/entity-contact";
import {
  CONTACTS_FEATURE_INTRODUCTION_HIGHLIGHTS,
  createContactsListViewModel,
  createContactsSearchViewModel,
  resolveContactsLedgerSyncIntroductionOpen,
  useAddAddressCurrencySelectionViewModel,
  useAddAddressFlowViewModel,
  useContacts,
  useContactsFeatureIntroductionState,
  useContactsMeContact,
  type AddAddressFlowState,
  type ContactsLedgerSyncStatus,
  type ContactsListViewLabels,
  type ContactsListViewProps,
} from "@features/flow-contacts";
import { MY_WALLET_AVATAR_USER_URL } from "LLD/features/MyWallet/components/UserAvatar/constants";
import { useContactsFeatureIntroductionPreference } from "../../hooks/useContactsFeatureIntroductionPreference";
import { useContactsCurrencySelectionAdapter } from "../../hooks/useContactsCurrencySelectionAdapter";
import { useContactDetailPaneAdapter } from "./useContactDetailPaneAdapter";

export type ContactsPageViewModel = Omit<ContactsListViewProps, "onAddContact"> &
  Readonly<{
    addAddressFlowState: AddAddressFlowState;
    onClearSearch: () => void;
  }>;

export function useContactsViewModel(): ContactsPageViewModel {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const meContact = useContactsMeContact();
  const contacts = useContacts();
  const currencySelection = useContactsCurrencySelectionAdapter();
  const { selectCurrency } = useAddAddressCurrencySelectionViewModel({
    platform: "desktop",
    currencySelection,
  });
  const {
    state: addAddressFlowState,
    start: startAddAddress,
    completeCurrencySelection,
    close: closeAddAddress,
  } = useAddAddressFlowViewModel();
  const onAddAddress = useCallback(
    (contactId: ContactId) => {
      startAddAddress(contactId);
      void selectCurrency()
        .then(result => {
          if (result.status === "selected") {
            completeCurrencySelection(contactId, result.currencyId);
          } else if (result.status === "cancelled" || result.status === "unavailable") {
            closeAddAddress();
          }
        })
        .catch(closeAddAddress);
    },
    [closeAddAddress, completeCurrencySelection, selectCurrency, startAddAddress],
  );
  const { detail, onOpenMe, onOpenContact } = useContactDetailPaneAdapter(contacts, onAddAddress);
  const [isLedgerSyncIntroductionDismissed, setIsLedgerSyncIntroductionDismissed] = useState(false);
  const [ledgerSyncStatus] = useState<ContactsLedgerSyncStatus>("ready");
  const preference = useContactsFeatureIntroductionPreference();
  const featureIntroductionState = useContactsFeatureIntroductionState({
    isContactsEntryAvailable: true,
    preference,
  });
  const labels = useMemo<ContactsListViewLabels>(
    () => ({
      title: t("contacts.title"),
      searchPlaceholder: t("contacts.searchPlaceholder"),
      searchNoResults: t("contacts.searchNoResults"),
      addContact: t("contacts.addContact"),
      formatAddressCount: count => t("contacts.addressCount", { count }),
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
  const onClearSearch = useCallback(() => setSearchQuery(""), []);
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
  const onCompleteFeatureIntroduction = useCallback(() => {
    featureIntroductionState.dismiss();
  }, [featureIntroductionState]);
  const onDeferFeatureIntroduction = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  return {
    addAddressFlowState,
    viewModel,
    labels,
    searchQuery,
    meAvatarSrc: MY_WALLET_AVATAR_USER_URL,
    onSearchInputChange,
    onClearSearch,
    onOpenMe,
    onOpenContact,
    detail,
    ledgerSyncStatus,
    featureIntroduction: {
      isOpen: featureIntroductionState.isRequested,
      title: t("contacts.featureIntroduction.title"),
      description: t("contacts.featureIntroduction.description"),
      highlights: featureIntroductionHighlights,
      primaryActionLabel: t("contacts.featureIntroduction.primaryAction"),
      secondaryActionLabel: t("contacts.featureIntroduction.secondaryAction"),
      onComplete: onCompleteFeatureIntroduction,
      onDefer: onDeferFeatureIntroduction,
    },
    ledgerSyncIntroduction: {
      isOpen: isLedgerSyncIntroductionOpen,
      description: t("contacts.ledgerSyncIntroduction.description"),
      dismissLabel: t("contacts.ledgerSyncIntroduction.dismiss"),
      onDismiss: onDismissLedgerSyncIntroduction,
    },
  };
}
