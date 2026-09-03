import { useContacts, useContactsFeature } from "@features/platform-contacts";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { isEligibleAddressCurrency } from "@ledgerhq/live-common/flows/send/recipient/utils/isEligibleAddressCurrency";
import { useRecipientSearchState } from "@ledgerhq/live-common/flows/send/recipient/hooks/useRecipientSearchState";
import { filterContactsByNetwork } from "@ledgerhq/live-common/flows/send/recipient/utils/filterContactsByNetwork";
import { pickContactAddressForCurrency } from "@ledgerhq/live-common/flows/send/recipient/utils/pickContactAddressForCurrency";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { TokenCurrency } from "@domain/entity-currency-token";
import type { Contact, ContactAddress } from "@domain/entity-contact";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { screen, track } from "~/analytics";
import { getSendFlowTrackingProperties } from "@ledgerhq/ledger-wallet-framework/tracking/send";
import { useSendFlowData } from "../../../context/SendFlowContext";
import { useRecipientContactSelection } from "../../../context/RecipientContactSelectionContext";
import { useSendFlowTracking } from "../../../context/SendFlowTrackingContext";
import { getRecipientResolution } from "../../../utils/contactTracking";
import { useContactsFeatureIntroductionViewModel } from "./useContactsFeatureIntroductionViewModel";
import { useAddressValidation } from "./useAddressValidation";
import { useClipboardRecipient } from "./useClipboardRecipient";

type UseRecipientScreenViewProps = Readonly<{
  account: AccountLike;
  parentAccount?: Account | null;
  transaction?: Transaction | null;
  currency: CryptoCurrency | TokenCurrency;
  onAddressSelected: (address: string, ensName?: string) => void;
  recipientSupportsDomain: boolean;
}>;

export function useRecipientScreenView({
  account,
  parentAccount,
  transaction,
  currency,
  onAddressSelected,
  recipientSupportsDomain,
}: UseRecipientScreenViewProps) {
  const { recipientSearch } = useSendFlowData();
  const contacts = useContacts();
  const { isEnabled: isContactsFeatureEnabled, eligibleAddressFamilies } =
    useContactsFeature("mobile");
  const { selectedContact, selectContact, clearSelectedContact } = useRecipientContactSelection();
  const { inputMethod, setInputMethod, setRecipientResolution, resetRecipientResolution } =
    useSendFlowTracking();
  const [pendingContactAddress, setPendingContactAddress] = useState<string>();

  const mainAccount = getMainAccount(account, parentAccount);
  const hasAddressBook = isEligibleAddressCurrency(eligibleAddressFamilies, currency);
  const sendFlowTrackingProperties = useMemo(
    () => getSendFlowTrackingProperties(account, parentAccount),
    [account, parentAccount],
  );

  const { result, isLoading } = useAddressValidation({
    searchValue: recipientSearch.value,
    currency,
    account,
    parentAccount,
    transaction,
    currentAccountId: mainAccount.id,
    recipientSupportsDomain,
    canSearchContactsByName: isContactsFeatureEnabled && hasAddressBook,
  });

  const contactsOnNetwork = useMemo(
    () => filterContactsByNetwork(contacts, currency.id),
    [contacts, currency.id],
  );
  const hasSearchValue = recipientSearch.value.length > 0;
  const contactSearchResult = useMemo(() => {
    if (!isContactsFeatureEnabled || !hasAddressBook) {
      return undefined;
    }

    const normalizedSearchValue = recipientSearch.value.trim().toLowerCase();
    if (!normalizedSearchValue) {
      return undefined;
    }

    return contactsOnNetwork.find(
      contact =>
        contact.addresses.length > 1 && contact.name.trim().toLowerCase() === normalizedSearchValue,
    );
  }, [contactsOnNetwork, hasAddressBook, isContactsFeatureEnabled, recipientSearch.value]);
  const showContactSearchResult =
    hasSearchValue && selectedContact === undefined && contactSearchResult !== undefined;
  const showInitialState = !hasSearchValue && selectedContact === undefined;
  const showContactsList =
    showInitialState && isContactsFeatureEnabled && hasAddressBook && contactsOnNetwork.length > 0;
  const showEmptyContactsState = useMemo(() => {
    if (!showInitialState || !isContactsFeatureEnabled || !hasAddressBook) {
      return false;
    }

    return contactsOnNetwork.length === 0;
  }, [contactsOnNetwork.length, hasAddressBook, isContactsFeatureEnabled, showInitialState]);

  const { clipboardAddress } = useClipboardRecipient({
    enabled: showInitialState,
    currency,
    account,
    parentAccount,
    transaction,
    currentAccountId: mainAccount.id,
    recipientSupportsDomain,
  });

  const recipientResolution = useMemo(
    () => getRecipientResolution(recipientSearch.value, result, showContactSearchResult),
    [recipientSearch.value, result, showContactSearchResult],
  );
  const trackedResolutionRef = useRef("");
  useEffect(() => {
    const hasSettledResult =
      showContactSearchResult ||
      (!isLoading && result.status !== "idle" && result.status !== "loading");
    if (!hasSearchValue || !hasSettledResult || selectedContact !== undefined) {
      return;
    }

    const trackingKey = [
      recipientSearch.value,
      recipientResolution.queryType,
      recipientResolution.resultType,
      inputMethod,
      recipientResolution.addressAlreadyUsed,
    ].join(":");
    if (trackedResolutionRef.current === trackingKey) {
      return;
    }
    trackedResolutionRef.current = trackingKey;

    void screen("Modal send - recipient result", undefined, {
      ...sendFlowTrackingProperties,
      queryType: recipientResolution.queryType,
      resultType: recipientResolution.resultType,
      inputMethod,
      queryLength: recipientSearch.value.length,
      addressAlreadyUsed: recipientResolution.addressAlreadyUsed,
    });
    setRecipientResolution(recipientResolution.resultType, recipientResolution.recipientType);
  }, [
    hasSearchValue,
    inputMethod,
    isLoading,
    recipientResolution,
    recipientSearch.value,
    result.status,
    selectedContact,
    sendFlowTrackingProperties,
    setRecipientResolution,
    showContactSearchResult,
  ]);

  useEffect(() => {
    if (hasSearchValue) {
      return;
    }

    trackedResolutionRef.current = "";
    resetRecipientResolution();
  }, [hasSearchValue, resetRecipientResolution]);

  const handlePasteFromClipboard = useCallback(() => {
    if (clipboardAddress) {
      setInputMethod("paste");
      track("button_clicked", {
        button: "paste",
        page: "step recipient",
        ...sendFlowTrackingProperties,
      });
      recipientSearch.setValue(clipboardAddress);
    }
  }, [clipboardAddress, recipientSearch, sendFlowTrackingProperties, setInputMethod]);

  const handleAddressSelect = useCallback(
    (address: string, ensName?: string) => {
      setPendingContactAddress(undefined);
      onAddressSelected(address, ensName);
    },
    [onAddressSelected],
  );

  const validateContactAddress = useCallback(
    (address: string) => {
      setPendingContactAddress(address);
      recipientSearch.setValue(address);
    },
    [recipientSearch],
  );

  const handleContactSelect = useCallback(
    (contact: Contact) => {
      track("button_clicked", {
        button: "contact",
        page: "step recipient",
        myContact: contact.isMe,
        addressCount: contact.addresses.length,
        ...sendFlowTrackingProperties,
      });
      const address = pickContactAddressForCurrency(contact.addresses, currency.id);
      if (address) {
        setRecipientResolution(
          contact.isMe ? "my account" : "contact name match",
          contact.isMe ? "my account" : "contact",
        );
        validateContactAddress(address.address);
        return;
      }

      selectContact(contact);
      void screen("Modal send - select contact address", undefined, {
        ...sendFlowTrackingProperties,
        addressCount: contact.addresses.length,
        myContact: contact.isMe,
      });
    },
    [
      currency.id,
      selectContact,
      sendFlowTrackingProperties,
      setRecipientResolution,
      validateContactAddress,
    ],
  );

  const handleContactAddressSelect = useCallback(
    (address: ContactAddress, addressRank: number) => {
      track("button_clicked", {
        button: "contact address",
        page: "select contact address",
        network: mainAccount.currency.id,
        asset: address.currencyId,
        addressRank,
        ...sendFlowTrackingProperties,
      });
      clearSelectedContact();
      setRecipientResolution(
        selectedContact?.isMe ? "my account" : "contact address match",
        selectedContact?.isMe ? "my account" : "contact",
      );
      validateContactAddress(address.address);
    },
    [
      clearSelectedContact,
      mainAccount.currency.id,
      selectedContact?.isMe,
      sendFlowTrackingProperties,
      setRecipientResolution,
      validateContactAddress,
    ],
  );

  const handleUnsupportedNetwork = useCallback(() => {
    track("button_clicked", {
      button: "disabled network tooltip",
      page: "step recipient",
      network: mainAccount.currency.id,
      ...sendFlowTrackingProperties,
    });
    void screen("Modal send - network not supported", undefined, {
      ...sendFlowTrackingProperties,
      network: mainAccount.currency.id,
    });
  }, [mainAccount.currency.id, sendFlowTrackingProperties]);

  const handleDismissUnsupportedNetwork = useCallback(() => {
    track("button_clicked", {
      button: "got it",
      page: "network not supported",
      network: mainAccount.currency.id,
      ...sendFlowTrackingProperties,
    });
  }, [mainAccount.currency.id, sendFlowTrackingProperties]);

  const featureIntroduction = useContactsFeatureIntroductionViewModel({
    isContactsEntryAvailable: isContactsFeatureEnabled && hasAddressBook,
  });

  const searchState = useRecipientSearchState({
    searchValue: recipientSearch.value,
    result,
    isLoading,
    recipientSupportsDomain,
  });

  useEffect(() => {
    const selectedAddressIsValidated =
      Boolean(pendingContactAddress) &&
      pendingContactAddress === recipientSearch.value &&
      searchState.isAddressValid &&
      !searchState.showBridgeSenderError &&
      !searchState.showBridgeRecipientWarning;
    if (selectedAddressIsValidated && pendingContactAddress) {
      handleAddressSelect(pendingContactAddress);
    }
  }, [
    handleAddressSelect,
    pendingContactAddress,
    recipientSearch.value,
    searchState.isAddressValid,
    searchState.showBridgeRecipientWarning,
    searchState.showBridgeSenderError,
  ]);

  const shouldHideRegularSearchState = showContactSearchResult || selectedContact !== undefined;

  return {
    searchValue: recipientSearch.value,
    isLoading: !shouldHideRegularSearchState && isLoading,
    result,
    mainAccount,
    hasAddressBook,
    addressBookFamilyName: mainAccount.currency.name,
    showInitialState,
    showContactsList,
    showContactSearchResult,
    showEmptyContactsState,
    contactsOnNetwork,
    contactSearchResult,
    selectedContact,
    clipboardAddress,
    handlePasteFromClipboard,
    handleAddressSelect,
    handleContactSelect,
    handleContactAddressSelect,
    handleUnsupportedNetwork,
    handleDismissUnsupportedNetwork,
    recipientResolution,
    isContactsFeatureEnabled,
    featureIntroduction,
    ...searchState,
    showSearchResults: !shouldHideRegularSearchState && searchState.showSearchResults,
    showMatchedAddress: !shouldHideRegularSearchState && searchState.showMatchedAddress,
    showAddressValidationError:
      !shouldHideRegularSearchState && searchState.showAddressValidationError,
    showEmptyState: !shouldHideRegularSearchState && searchState.showEmptyState,
    showBridgeSenderError: !shouldHideRegularSearchState && searchState.showBridgeSenderError,
    showSanctionedBanner: !shouldHideRegularSearchState && searchState.showSanctionedBanner,
    showBridgeRecipientError: !shouldHideRegularSearchState && searchState.showBridgeRecipientError,
    showBridgeRecipientWarning:
      !shouldHideRegularSearchState && searchState.showBridgeRecipientWarning,
    isAddressComplete: !shouldHideRegularSearchState && searchState.isAddressComplete,
    isAddressValid: !shouldHideRegularSearchState && searchState.isAddressValid,
  };
}
