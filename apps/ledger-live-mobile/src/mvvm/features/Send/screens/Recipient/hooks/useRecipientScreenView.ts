import { useContacts, useContactsFeature } from "@features/platform-contacts";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { isEligibleAddressCurrency } from "@ledgerhq/live-common/flows/send/recipient/utils/isEligibleAddressCurrency";
import { useRecipientSearchState } from "@ledgerhq/live-common/flows/send/recipient/hooks/useRecipientSearchState";
import { filterContactsByNetwork } from "@ledgerhq/live-common/flows/send/recipient/utils/filterContactsByNetwork";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { TokenCurrency } from "@domain/entity-currency-token";
import type { Contact, ContactAddress } from "@domain/entity-contact";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { screen, track } from "~/analytics";
import { getSendFlowTrackingProperties } from "@ledgerhq/ledger-wallet-framework/tracking/send";
import type { ContactAddressPickerProps } from "@features/flow-pay-contact";
import { useContactAddressPicker } from "LLM/features/Contacts/hooks/useContactAddressPicker";
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
  const { selectedContact } = useRecipientContactSelection();
  const { inputMethod, setInputMethod, setRecipientResolution, resetRecipientResolution } =
    useSendFlowTracking();

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
      onAddressSelected(address, ensName);
    },
    [onAddressSelected],
  );

  // The picker owns the contact being shown and the row order the user actually sees,
  // so the tracked rank is read back from it rather than from `contact.addresses`.
  const pickerRef = useRef<ContactAddressPickerProps | undefined>(undefined);

  const handleContactAddressSelect = useCallback(
    (address: ContactAddress) => {
      const pickedContact = pickerRef.current?.contact;
      track("button_clicked", {
        button: "contact address",
        page: "select contact address",
        network: mainAccount.currency.id,
        asset: address.currencyId,
        addressRank: (pickerRef.current?.groups ?? [])
          .flatMap(group => group.rows)
          .findIndex(row => row.addressId === address.id),
        ...sendFlowTrackingProperties,
      });
      setRecipientResolution(
        pickedContact?.isMe ? "my account" : "contact address match",
        pickedContact?.isMe ? "my account" : "contact",
      );
      handleAddressSelect(address.address);
    },
    [
      handleAddressSelect,
      mainAccount.currency.id,
      sendFlowTrackingProperties,
      setRecipientResolution,
    ],
  );
  const { open: openPicker, contactAddressPicker } = useContactAddressPicker({
    onSelectAddress: handleContactAddressSelect,
  });
  pickerRef.current = contactAddressPicker;

  const handleContactSelect = useCallback(
    (contact: Contact) => {
      track("button_clicked", {
        button: "contact",
        page: "step recipient",
        myContact: contact.isMe,
        addressCount: contact.addresses.length,
        ...sendFlowTrackingProperties,
      });
      openPicker(contact);
      void screen("Modal send - select contact address", undefined, {
        ...sendFlowTrackingProperties,
        addressCount: contact.addresses.length,
        myContact: contact.isMe,
      });
    },
    [openPicker, sendFlowTrackingProperties],
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
    contactAddressPicker,
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
