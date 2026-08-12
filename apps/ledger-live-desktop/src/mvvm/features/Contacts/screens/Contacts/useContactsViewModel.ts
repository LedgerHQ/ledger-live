import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { urls } from "~/config/urls";
import { useLocalizedUrl } from "~/renderer/hooks/useLocalizedUrls";
import { openURL } from "~/renderer/linking";
import { v4 as uuid } from "uuid";
import {
  CONTACT_ADDRESS_LABEL_TOO_LONG_ERROR_NAME,
  DUPLICATE_CONTACT_ADDRESS_LABEL_ERROR_NAME,
  INVALID_CONTACT_ADDRESS_LABEL_ERROR_NAME,
  addAddress,
  contactAddress,
  type ContactId,
} from "@domain/entity-contact";
import {
  createContactsListViewModel,
  createContactsSearchViewModel,
  useAddAddressCurrencySelectionViewModel,
  useAddAddressFlowViewModel,
  useContactsMeContact,
  type AddAddressContact,
  type AddAddressFlowState,
  type ContactsAddAddressEntryLabels,
  type ContactsAddAddressNameLabels,
  type ContactAddressDetailDialogProps,
  type ContactsListViewLabels,
  type ContactsViewProps,
  CONTACTS_EVENT_SOURCE,
  CONTACTS_FLOW,
  CONTACTS_PAGE_EVENTS,
  CONTACTS_PAGE_PROPERTY,
  CONTACTS_TRACK_EVENTS,
  CONTACTS_TRACKING_BUTTON,
} from "@features/flow-contacts";
import {
  CONTACTS_FEATURE_INTRODUCTION_HIGHLIGHTS,
  resolveContactsLedgerSyncIntroductionOpen,
  useContactsFeatureIntroductionState,
  type ContactsLedgerSyncStatus,
} from "@features/flow-contacts-introduction";
import { createMockContactDeviceIntentsPort, useContacts } from "@features/platform-contacts";
import { MY_WALLET_AVATAR_USER_URL } from "LLD/features/MyWallet/components/UserAvatar/constants";
import { useContactsAnalytics, resolveContactsCurrencyAnalytics } from "../../analytics";
import { useContactsFeatureIntroductionPreference } from "../../hooks/useContactsFeatureIntroductionPreference";
import { useContactsCurrencySelectionAdapter } from "../../hooks/useContactsCurrencySelectionAdapter";
import { useContactsAddressValidationAdapter } from "../../hooks/useContactsAddressValidationAdapter";
import { useContactDetailPaneAdapter } from "./useContactDetailPaneAdapter";
import type { ContactAddressDetailActionsDialogProps } from "./useContactAddressDetailActionsAdapter";
import { useContactDetailEditDeleteAdapter } from "./useContactDetailEditDeleteAdapter";
import { useDispatch } from "LLD/hooks/redux";
import type {
  ContactsAddAddressFlowDialogProps,
  ContactsAddAddressReviewLabels,
} from "./components/ContactsAddAddressFlowDialog";

export type ContactsPageViewModel = Omit<ContactsViewProps, "onAddContact"> &
  Readonly<{
    addAddressFlowState: AddAddressFlowState;
    addAddressFlowDialog: ContactsAddAddressFlowDialogProps;
    addressDetailDialog: ContactAddressDetailDialogProps;
    editDeleteDialogs: ReturnType<typeof useContactDetailEditDeleteAdapter>;
    addressDetailActionsDialogs: ContactAddressDetailActionsDialogProps;
    onClearSearch: () => void;
  }>;

export function useContactsViewModel(): ContactsPageViewModel {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const analytics = useContactsAnalytics();
  const hasTrackedListPage = useRef(false);
  const hasTrackedLedgerSyncGate = useRef(false);
  const helpCenterUrl = useLocalizedUrl(urls.helpModal.helpCenter);
  const handleSanctionedAddressLearnMore = useCallback(() => {
    openURL(helpCenterUrl);
  }, [helpCenterUrl]);
  const [searchQuery, setSearchQuery] = useState("");
  const meContact = useContactsMeContact();
  const contacts = useContacts();
  const deviceIntents = useMemo(() => createMockContactDeviceIntentsPort(), []);
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
    completeMockConfirmation,
    close: closeAddAddress,
  } = useAddAddressFlowViewModel({ addressValidation });
  const saveAddressFromReview = useCallback(async () => {
    if (addAddressFlowState.status !== "reviewingAddress") {
      return;
    }

    const { network, asset } = await resolveContactsCurrencyAnalytics(
      addAddressFlowState.selectedCurrencyId,
    );
    const inputMethod = addAddressFlowState.addressEntry.inputMethod ?? "manual";

    analytics.trackEvent(CONTACTS_TRACK_EVENTS.BUTTON_CLICKED, {
      source: CONTACTS_EVENT_SOURCE.ADD_ADDRESS,
      button: CONTACTS_TRACKING_BUTTON.saveAddress,
      page: CONTACTS_PAGE_PROPERTY.CONTACT_DETAIL,
      network,
      asset,
      inputMethod,
      flow: CONTACTS_FLOW.CONTACTS,
    });

    const selectedContact = contacts.find(
      contact => contact.id === addAddressFlowState.selectedContactId,
    );
    if (selectedContact === undefined) {
      return;
    }
    const signedAddress = await deviceIntents.registerExternalAddress({
      contact: selectedContact,
      currencyId: addAddressFlowState.selectedCurrencyId,
      label: addAddressFlowState.addressLabel.label,
      address: addAddressFlowState.addressEntry.resolvedAddress,
    });

    const address = contactAddress({
      id: `address-${uuid()}`,
      currencyId: addAddressFlowState.selectedCurrencyId,
      label: addAddressFlowState.addressLabel.label,
      address: addAddressFlowState.addressEntry.resolvedAddress,
      device: signedAddress.addressDeviceContext,
    });

    dispatch(
      addAddress({
        contactId: addAddressFlowState.selectedContactId,
        address,
        deviceCredentials: signedAddress.deviceCredentials,
      }),
    );

    analytics.trackEvent(CONTACTS_TRACK_EVENTS.ADDRESS_ADDED, {
      source: CONTACTS_EVENT_SOURCE.ADD_ADDRESS,
      network,
      asset,
      inputMethod,
      isEns: inputMethod === "ens",
      flow: CONTACTS_FLOW.CONTACTS,
    });

    continueFromReview();
  }, [addAddressFlowState, analytics, contacts, continueFromReview, deviceIntents, dispatch]);
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
      addAddressFlowState.status === "reviewingAddress" ||
      addAddressFlowState.status === "confirmationRequired"
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
      namingDisclaimer: t("contacts.addAddressName.namingDisclaimer"),
      namingDisclaimerAccessibilityLabel: t(
        "contacts.addAddressName.namingDisclaimerAccessibilityLabel",
      ),
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
      sanctionedAddressBanner: {
        description: t("contacts.addAddressEntry.sanctioned.description"),
        actionLabel: t("contacts.addAddressEntry.sanctioned.learnMore"),
        onAction: handleSanctionedAddressLearnMore,
      },
      nameLabels: addAddressNameLabels,
      reviewLabels: addAddressReviewLabels,
      onAddressChange: (address, inputMethod) => {
        void updateAddress(address, inputMethod);
      },
      onContinueFromAddressDetails: continueFromAddressDetails,
      onAddressLabelChange: updateAddressLabel,
      onContinueFromName: continueFromName,
      onContinueFromReview: saveAddressFromReview,
      onCompleteMockConfirmation: completeMockConfirmation,
      onBack: onBackAddAddress,
      onClose: onCloseAddAddress,
    }),
    [
      addAddressEntryLabels,
      handleSanctionedAddressLearnMore,
      addAddressNameLabels,
      addAddressReviewLabels,
      addAddressFlowState,
      onBackAddAddress,
      onCloseAddAddress,
      updateAddress,
      updateAddressLabel,
      continueFromAddressDetails,
      continueFromName,
      saveAddressFromReview,
      completeMockConfirmation,
      t,
    ],
  );
  const {
    detail,
    addressDetailDialog,
    editDeleteDialogs,
    addressDetailActionsDialogs,
    onOpenMe,
    onOpenContact,
  } = useContactDetailPaneAdapter(onAddAddress);
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
      formatMeDisplayName: name => t("contacts.detail.meDisplayName", { name }),
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
      return createContactsSearchViewModel(
        meContact,
        contacts,
        searchQuery,
        labels.formatMeDisplayName,
      );
    }

    return createContactsListViewModel(meContact, contacts, labels.formatMeDisplayName);
  }, [contacts, labels.formatMeDisplayName, meContact, searchQuery]);
  const onSearchInputChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  }, []);
  const onClearSearch = useCallback(() => setSearchQuery(""), []);
  const onDismissLedgerSyncIntroduction = useCallback(() => {
    analytics.trackEvent(CONTACTS_TRACK_EVENTS.BUTTON_CLICKED, {
      source: CONTACTS_EVENT_SOURCE.LEDGER_SYNC_GATE,
      button: CONTACTS_TRACKING_BUTTON.dismiss,
      page: CONTACTS_PAGE_PROPERTY.LEDGER_SYNC_GATE,
    });
    setIsLedgerSyncIntroductionDismissed(true);
  }, [analytics]);

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

  useEffect(() => {
    if (hasTrackedListPage.current) {
      return;
    }

    hasTrackedListPage.current = true;
    analytics.trackPage(CONTACTS_PAGE_EVENTS.CONTACTS, {
      source: CONTACTS_EVENT_SOURCE.LIST,
      page: CONTACTS_PAGE_PROPERTY.CONTACTS,
    });
  }, [analytics]);

  const searchHasResults = !("status" in viewModel && viewModel.status === "no-results");

  useEffect(() => {
    const trimmedQuery = searchQuery.trim();

    if (trimmedQuery.length === 0) {
      return;
    }

    const timeoutId = setTimeout(() => {
      analytics.trackEvent(CONTACTS_TRACK_EVENTS.SEARCH_QUERY, {
        source: CONTACTS_EVENT_SOURCE.SEARCH,
        page: CONTACTS_PAGE_PROPERTY.CONTACTS,
        queryLength: trimmedQuery.length,
        hasResults: searchHasResults,
      });
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [analytics, searchHasResults, searchQuery]);

  useEffect(() => {
    if (!isLedgerSyncIntroductionOpen || hasTrackedLedgerSyncGate.current) {
      return;
    }

    hasTrackedLedgerSyncGate.current = true;
    analytics.trackPage(CONTACTS_PAGE_EVENTS.ACTIVATE_LEDGER_SYNC, {
      source: CONTACTS_EVENT_SOURCE.LEDGER_SYNC_GATE,
      flow: CONTACTS_FLOW.CONTACTS,
      previousPage: CONTACTS_PAGE_PROPERTY.CONTACTS,
    });
  }, [analytics, isLedgerSyncIntroductionOpen]);

  useEffect(() => {
    if (!isLedgerSyncIntroductionOpen) {
      hasTrackedLedgerSyncGate.current = false;
    }
  }, [isLedgerSyncIntroductionOpen]);

  return {
    addAddressFlowState,
    addAddressFlowDialog,
    addressDetailDialog,
    editDeleteDialogs,
    addressDetailActionsDialogs,
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
