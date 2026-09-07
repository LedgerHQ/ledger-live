import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { getCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
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
  type ContactAddressDetailDialogProps,
  type ContactsListViewLabels,
  CONTACTS_EVENT_SOURCE,
  CONTACTS_FLOW,
  CONTACTS_PAGE_PROPERTY,
  CONTACTS_TRACK_EVENTS,
  CONTACTS_TRACKING_BUTTON,
  trackContactsLedgerSyncActivate,
  useContactsListPageAnalytics,
  useContactsLedgerSyncMutationGuard,
  trackContactsLedgerSyncDismiss,
} from "@features/flow-contacts";
import {
  useAddAddressCurrencySelectionViewModel,
  useAddAddressFlowViewModel,
  type AddAddressContact,
  type AddAddressEntryLabels,
  type AddAddressFlowState,
  type ContactsAddAddressNameLabels,
  type ContactsAddAddressReviewLabels,
} from "@features/flow-contacts-add-address";
import {
  CONTACTS_FEATURE_INTRODUCTION_HIGHLIGHTS,
  isContactsLedgerSyncActivationRequired,
  resolveContactsLedgerSyncIntroductionOpen,
  useContactsFeatureIntroductionState,
} from "@features/flow-contacts-introduction";
import { getMinVersion } from "@ledgerhq/live-common/apps/support";
import { useContacts, useContactsMeContact } from "@features/platform-contacts";
import { useContactsIntentsOrchestrator } from "@features/platform-contacts/device";
import { MY_WALLET_AVATAR_USER_URL } from "LLD/features/MyWallet/components/UserAvatar/constants";
import { useContactsAnalytics, resolveContactsCurrencyAnalytics } from "../../analytics";
import { contactsIntentLWDDefinitions } from "../../deviceIntents/contactsIntentPlatformDefinitions";
import { useContactsFeatureIntroductionPreference } from "../../hooks/useContactsFeatureIntroductionPreference";
import { useContactsCurrencySelectionAdapter } from "../../hooks/useContactsCurrencySelectionAdapter";
import { useContactsAddressValidationAdapter } from "../../hooks/useContactsAddressValidationAdapter";
import { useContactsLedgerSyncStatus } from "../../hooks/useContactsLedgerSyncStatus";
import { useContactDetailPaneAdapter } from "./useContactDetailPaneAdapter";
import type { ContactsViewProps } from "./ContactsView";
import type { ContactAddressDetailActionsDialogProps } from "./useContactAddressDetailActionsAdapter";
import { useContactDetailEditDeleteAdapter } from "./useContactDetailEditDeleteAdapter";
import { useDispatch } from "LLD/hooks/redux";
import { useActivationDrawer } from "LLD/features/LedgerSyncEntryPoints/hooks/useActivationDrawer";
import type { ContactsAddAddressFlowDialogProps } from "./components/ContactsAddAddressFlowDialog";

export type ContactsPageViewModel = Omit<ContactsViewProps, "onAddContact" | "addContactDialog"> &
  Readonly<{
    addAddressFlowState: AddAddressFlowState;
    addAddressFlowDialog: ContactsAddAddressFlowDialogProps;
    addressDetailDialog: ContactAddressDetailDialogProps;
    editDeleteDialogs: ReturnType<typeof useContactDetailEditDeleteAdapter>;
    addressDetailActionsDialogs: ContactAddressDetailActionsDialogProps;
    onClearSearch: () => void;
    onRequestAddContact: (onAllowed: () => void) => void;
    onSelectContact: (contactId: ContactId) => void;
  }>;

export function useContactsViewModel(): ContactsPageViewModel {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const analytics = useContactsAnalytics();
  const { openDrawer } = useActivationDrawer();
  const helpCenterUrl = useLocalizedUrl(urls.helpModal.helpCenter);
  const isSavingAddress = useRef(false);
  const handleSanctionedAddressLearnMore = useCallback(() => {
    openURL(helpCenterUrl);
  }, [helpCenterUrl]);
  const [searchQuery, setSearchQuery] = useState("");
  const meContact = useContactsMeContact();
  const contacts = useContacts();
  const { deviceIntents, dieProps } = useContactsIntentsOrchestrator({
    intents: contactsIntentLWDDefinitions,
    getLiveConfigMinVersion: getMinVersion,
  });
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
    completeConfirmation,
    close: closeAddAddress,
  } = useAddAddressFlowViewModel({ addressValidation });
  const saveAddress = useCallback(
    async (
      flowState: Extract<
        AddAddressFlowState,
        { status: "reviewingAddress" } | { status: "confirmationRequired" }
      >,
    ) => {
      const selectedContact = contacts.find(contact => contact.id === flowState.selectedContactId);
      if (selectedContact === undefined || isSavingAddress.current) {
        return;
      }

      isSavingAddress.current = true;
      try {
        const { network, asset } = await resolveContactsCurrencyAnalytics(
          flowState.selectedCurrencyId,
          {
            findTokenById: currencyId => getCryptoAssetsStore().findTokenById(currencyId),
          },
        );
        const inputMethod = flowState.addressEntry.inputMethod ?? "manual";

        analytics.trackEvent(CONTACTS_TRACK_EVENTS.BUTTON_CLICKED, {
          source: CONTACTS_EVENT_SOURCE.ADD_ADDRESS,
          button: CONTACTS_TRACKING_BUTTON.saveAddress,
          page: CONTACTS_PAGE_PROPERTY.CONTACT_DETAIL,
          network,
          asset,
          inputMethod,
          flow: CONTACTS_FLOW.CONTACTS,
        });

        const signedAddress = await deviceIntents.registerExternalAddress({
          contact: selectedContact,
          currencyId: flowState.selectedCurrencyId,
          label: flowState.addressLabel.label,
          address: flowState.addressEntry.resolvedAddress,
        });

        const address = contactAddress({
          id: `address-${uuid()}`,
          currencyId: flowState.selectedCurrencyId,
          label: flowState.addressLabel.label,
          address: flowState.addressEntry.resolvedAddress,
          device: signedAddress.addressDeviceContext,
        });

        dispatch(
          addAddress({
            contactId: flowState.selectedContactId,
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

        if (flowState.status === "confirmationRequired") {
          completeConfirmation();
        } else {
          continueFromReview();
        }
        closeAddAddress();
      } catch {
        closeAddAddress();
      } finally {
        isSavingAddress.current = false;
      }
    },
    [
      analytics,
      closeAddAddress,
      completeConfirmation,
      contacts,
      continueFromReview,
      deviceIntents,
      dispatch,
    ],
  );
  const continueFromNameAndConfirm = useCallback(() => {
    if (
      addAddressFlowState.status !== "namingAddress" ||
      addAddressFlowState.addressLabel.status !== "valid"
    ) {
      return;
    }
    if (addAddressFlowState.entryMode === "prefilled") {
      continueFromName();
      return;
    }

    continueFromName();
    void saveAddress({
      ...addAddressFlowState,
      addressEntry: addAddressFlowState.addressEntry,
      addressLabel: addAddressFlowState.addressLabel,
      status: "confirmationRequired",
    });
  }, [addAddressFlowState, continueFromName, saveAddress]);
  const continueFromAddressDetailsAndConfirm = useCallback(() => {
    if (
      addAddressFlowState.status !== "enteringAddress" ||
      addAddressFlowState.addressEntry.status !== "valid" ||
      addAddressFlowState.addressLabel.status !== "valid"
    ) {
      return;
    }

    continueFromAddressDetails();
    void saveAddress({
      ...addAddressFlowState,
      addressEntry: addAddressFlowState.addressEntry,
      addressLabel: addAddressFlowState.addressLabel,
      status: "reviewingAddress",
      origin: "addressDetails",
    });
  }, [addAddressFlowState, continueFromAddressDetails, saveAddress]);
  const saveAddressFromReview = useCallback(() => {
    if (addAddressFlowState.status === "reviewingAddress") {
      void saveAddress(addAddressFlowState);
    }
  }, [addAddressFlowState, saveAddress]);
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
  const ledgerSyncStatus = useContactsLedgerSyncStatus();
  const { requestMutation, dismissPendingIntent } = useContactsLedgerSyncMutationGuard();
  const [isLedgerSyncIntroductionRequested, setIsLedgerSyncIntroductionRequested] = useState(false);
  const onAddAddress = useCallback(
    (contact: AddAddressContact) => {
      const result = requestMutation(
        { kind: "addAddress", contactId: contact.id },
        ledgerSyncStatus,
      );
      if (result.status !== "allowed") {
        if (result.status === "blocked") {
          setIsLedgerSyncIntroductionRequested(true);
        }
        return;
      }

      startAddAddress(contact);
      selectCurrencyForContact(contact.id);
    },
    [ledgerSyncStatus, requestMutation, selectCurrencyForContact, startAddAddress],
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
  const addAddressEntryLabels = useMemo<AddAddressEntryLabels>(
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
      addressLabel: t("contacts.addAddressReview.addressLabel"),
      currencyLabel: t("contacts.addAddressReview.currencyLabel"),
      networkLabel: t("contacts.addAddressReview.networkLabel"),
      nameLabel: t("contacts.addAddressReview.nameLabel"),
      continue: t("contacts.addAddressReview.continue"),
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
      onContinueFromAddressDetails: continueFromAddressDetailsAndConfirm,
      onAddressLabelChange: updateAddressLabel,
      onContinueFromName: continueFromNameAndConfirm,
      onContinueFromReview: saveAddressFromReview,
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
      continueFromAddressDetailsAndConfirm,
      continueFromNameAndConfirm,
      saveAddressFromReview,
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
    onSelectContact,
  } = useContactDetailPaneAdapter(onAddAddress, deviceIntents);
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
    trackContactsLedgerSyncDismiss(analytics);
    dismissPendingIntent();
    setIsLedgerSyncIntroductionRequested(false);
  }, [analytics, dismissPendingIntent]);
  const onActivateLedgerSyncIntroduction = useCallback(() => {
    trackContactsLedgerSyncActivate(analytics);
    dismissPendingIntent();
    setIsLedgerSyncIntroductionRequested(false);
    openDrawer({ startOnSyncMethod: true });
  }, [analytics, dismissPendingIntent, openDrawer]);
  const onRequestAddContact = useCallback(
    (onAllowed: () => void) => {
      const result = requestMutation({ kind: "addContact" }, ledgerSyncStatus);
      if (result.status === "allowed") {
        onAllowed();
      } else if (result.status === "blocked") {
        setIsLedgerSyncIntroductionRequested(true);
      }
    },
    [ledgerSyncStatus, requestMutation],
  );

  useEffect(() => {
    if (!isContactsLedgerSyncActivationRequired(ledgerSyncStatus)) {
      dismissPendingIntent();
      setIsLedgerSyncIntroductionRequested(false);
    }
  }, [dismissPendingIntent, ledgerSyncStatus]);

  const isLedgerSyncIntroductionOpen = resolveContactsLedgerSyncIntroductionOpen({
    isFeatureIntroductionRequested: featureIntroductionState.isRequested,
    ledgerSyncStatus,
    isLedgerSyncIntroductionRequested,
  });
  const onCompleteFeatureIntroduction = useCallback(() => {
    featureIntroductionState.dismiss();
  }, [featureIntroductionState]);
  const onCloseFeatureIntroduction = useCallback(() => {
    navigate(-1);
  }, [navigate]);
  const searchHasResults = !("status" in viewModel && viewModel.status === "no-results");

  useContactsListPageAnalytics({
    analytics,
    searchQuery,
    searchHasResults,
    isLedgerSyncIntroductionOpen,
  });

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
    onRequestAddContact,
    onOpenMe,
    onOpenContact,
    onSelectContact,
    detail,
    ledgerSyncStatus,
    dieProps,
    featureIntroduction: {
      isOpen: featureIntroductionState.isRequested,
      title: t("contacts.featureIntroduction.title"),
      highlights: featureIntroductionHighlights,
      primaryActionLabel: t("contacts.featureIntroduction.primaryAction"),
      onComplete: onCompleteFeatureIntroduction,
      onClose: onCloseFeatureIntroduction,
    },
    ledgerSyncIntroduction: {
      isOpen: isLedgerSyncIntroductionOpen,
      title: t("contacts.ledgerSyncIntroduction.title"),
      description: t("contacts.ledgerSyncIntroduction.description"),
      activateLabel: t("contacts.ledgerSyncIntroduction.activate"),
      dismissLabel: t("contacts.ledgerSyncIntroduction.dismiss"),
      onActivate: onActivateLedgerSyncIntroduction,
      onDismiss: onDismissLedgerSyncIntroduction,
    },
  };
}
