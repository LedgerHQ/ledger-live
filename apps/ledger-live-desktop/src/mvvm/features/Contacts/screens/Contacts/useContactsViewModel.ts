import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import {
  CONTACT_ADDRESS_LABEL_TOO_LONG_ERROR_NAME,
  DUPLICATE_CONTACT_ADDRESS_LABEL_ERROR_NAME,
  INVALID_CONTACT_ADDRESS_LABEL_ERROR_NAME,
  type ContactId,
} from "@domain/entity-contact";
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
  type AddAddressContact,
  type AddAddressFlowState,
  type ContactsAddAddressEntryLabels,
  type ContactsAddAddressNameLabels,
  type ContactAddressDetailDialogProps,
  type ContactsLedgerSyncStatus,
  type ContactsListViewLabels,
  type ContactsListViewProps,
} from "@features/flow-contacts";
import { MY_WALLET_AVATAR_USER_URL } from "LLD/features/MyWallet/components/UserAvatar/constants";
import { useContactsFeatureIntroductionPreference } from "../../hooks/useContactsFeatureIntroductionPreference";
import { useContactsCurrencySelectionAdapter } from "../../hooks/useContactsCurrencySelectionAdapter";
import { useContactsAddressValidationAdapter } from "../../hooks/useContactsAddressValidationAdapter";
import { useContactDetailPaneAdapter } from "./useContactDetailPaneAdapter";
import { useContactDetailEditDeleteAdapter } from "./useContactDetailEditDeleteAdapter";
import type {
  ContactsAddAddressFlowDialogProps,
  ContactsAddAddressReviewLabels,
} from "./components/ContactsAddAddressFlowDialog";

export type ContactsPageViewModel = Omit<ContactsListViewProps, "onAddContact"> &
  Readonly<{
    addAddressFlowState: AddAddressFlowState;
    addAddressFlowDialog: ContactsAddAddressFlowDialogProps;
    addressDetailDialog: ContactAddressDetailDialogProps;
    editDeleteDialogs: ReturnType<typeof useContactDetailEditDeleteAdapter>;
    onClearSearch: () => void;
  }>;

export function useContactsViewModel(): ContactsPageViewModel {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const meContact = useContactsMeContact();
  const contacts = useContacts();
  const currencySelection = useContactsCurrencySelectionAdapter();
  const { cancelCurrencySelection } = currencySelection;
  const addressValidation = useContactsAddressValidationAdapter();
  const { selectCurrency } = useAddAddressCurrencySelectionViewModel({
    platform: "desktop",
    currencySelection,
  });
  const {
    state: addAddressFlowState,
    start: startAddAddress,
    completeCurrencySelection,
    goBack: goBackAddAddress,
    updateAddress,
    updateAddressLabel,
    continueFromAddressDetails,
    continueFromName,
    continueFromReview,
    close: closeAddAddress,
  } = useAddAddressFlowViewModel({ addressValidation });
  const selectCurrencyForContact = useCallback(
    (contactId: ContactId) => {
      void selectCurrency()
        .then(result => {
          if (result.status === "selected") {
            completeCurrencySelection(contactId, result.selection);
          } else if (result.status === "cancelled" || result.status === "unavailable") {
            closeAddAddress();
          }
        })
        .catch(closeAddAddress);
    },
    [closeAddAddress, completeCurrencySelection, selectCurrency],
  );
  const onAddAddress = useCallback(
    (contact: AddAddressContact) => {
      startAddAddress(contact);
      selectCurrencyForContact(contact.id);
    },
    [selectCurrencyForContact, startAddAddress],
  );
  const onCloseAddAddress = useCallback(() => {
    cancelCurrencySelection();
    closeAddAddress();
  }, [cancelCurrencySelection, closeAddAddress]);
  const onBackAddAddress = useCallback(() => {
    if (
      addAddressFlowState.status === "namingAddress" ||
      addAddressFlowState.status === "reviewingAddress"
    ) {
      goBackAddAddress();
      return;
    }

    if (addAddressFlowState.status !== "enteringAddress") {
      return;
    }

    const { selectedContactId } = addAddressFlowState;
    goBackAddAddress();
    selectCurrencyForContact(selectedContactId);
  }, [addAddressFlowState, goBackAddAddress, selectCurrencyForContact]);
  const addAddressEntryLabels = useMemo<ContactsAddAddressEntryLabels>(
    () => ({
      title: t("contacts.addAddressEntry.title"),
      addressPlaceholder: t("contacts.addAddressEntry.addressPlaceholder"),
      confirmAddress: t("contacts.addAddressEntry.confirmAddress"),
      validatingAddress: t("contacts.addAddressEntry.validatingAddress"),
      validAddress: t("contacts.addAddressEntry.validAddress"),
      invalidAddress: t("contacts.addAddressEntry.invalidAddress"),
      domainNotFound: t("contacts.addAddressEntry.domainNotFound"),
      sanctionedAddress: t("contacts.addAddressEntry.sanctionedAddress"),
      validationUnavailable: t("contacts.addAddressEntry.validationUnavailable"),
      ensDisclaimer: t("contacts.addAddressEntry.ensDisclaimer"),
    }),
    [t],
  );
  const addAddressNameLabels = useMemo<ContactsAddAddressNameLabels>(
    () => ({
      inputLabel: t("contacts.addAddressName.inputLabel"),
      continueToReview: t("contacts.addAddressName.continueToReview"),
      validAddress: t("contacts.addAddressEntry.validAddress"),
      validationErrors: {
        [INVALID_CONTACT_ADDRESS_LABEL_ERROR_NAME]: t("contacts.addAddressName.invalidLabel"),
        [DUPLICATE_CONTACT_ADDRESS_LABEL_ERROR_NAME]: t("contacts.addAddressName.duplicateLabel"),
        [CONTACT_ADDRESS_LABEL_TOO_LONG_ERROR_NAME]: t("contacts.addAddressName.tooLongLabel"),
      },
    }),
    [t],
  );
  const addAddressReviewLabels = useMemo<ContactsAddAddressReviewLabels>(
    () => ({
      title: t("contacts.addAddressReview.title"),
      continue: t("contacts.addAddressReview.continue"),
      successTitle: t("contacts.addAddressReview.successTitle"),
      close: t("contacts.addAddressReview.close"),
    }),
    [t],
  );
  const addAddressFlowDialog = useMemo<ContactsAddAddressFlowDialogProps>(
    () => ({
      state: addAddressFlowState,
      entryLabels: addAddressEntryLabels,
      nameLabels: addAddressNameLabels,
      reviewLabels: addAddressReviewLabels,
      onAddressChange: (address, inputMethod) => {
        void updateAddress(address, inputMethod);
      },
      onContinueFromAddressDetails: continueFromAddressDetails,
      onAddressLabelChange: updateAddressLabel,
      onContinueFromName: continueFromName,
      onContinueFromReview: continueFromReview,
      onBack: onBackAddAddress,
      onClose: onCloseAddAddress,
    }),
    [
      addAddressEntryLabels,
      addAddressNameLabels,
      addAddressReviewLabels,
      addAddressFlowState,
      onBackAddAddress,
      onCloseAddAddress,
      updateAddress,
      updateAddressLabel,
      continueFromAddressDetails,
      continueFromName,
      continueFromReview,
    ],
  );
  const { detail, addressDetailDialog, editDeleteDialogs, onOpenMe, onOpenContact } =
    useContactDetailPaneAdapter(onAddAddress);
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
    addAddressFlowDialog,
    addressDetailDialog,
    editDeleteDialogs,
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
