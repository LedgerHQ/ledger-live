import { useContacts, useContactsFeature } from "@features/platform-contacts";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor/send/features";
import { useRecipientSearchState } from "@ledgerhq/live-common/flows/send/recipient/hooks/useRecipientSearchState";
import {
  findContactWithMultipleAddressesByName,
  getContactsOnNetwork,
} from "@ledgerhq/live-common/flows/send/recipient/utils/hasContactsOnNetwork";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { TokenCurrency } from "@domain/entity-currency-token";
import type { Contact } from "@domain/entity-contact";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { useCallback, useMemo, useState } from "react";
import { useSendFlowData } from "../../../context/SendFlowContext";
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
  const { isEnabled: isContactsFeatureEnabled } = useContactsFeature("mobile");
  const [selectedContact, setSelectedContact] = useState<Contact>();

  const mainAccount = getMainAccount(account, parentAccount);
  const hasAddressBook = sendFeatures.hasAddressBook(currency);

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
    () => getContactsOnNetwork(contacts, currency.id),
    [contacts, currency.id],
  );
  const hasSearchValue = recipientSearch.value.length > 0;
  const contactSearchResult = useMemo(() => {
    if (!isContactsFeatureEnabled || !hasAddressBook) {
      return undefined;
    }

    return findContactWithMultipleAddressesByName(contactsOnNetwork, recipientSearch.value);
  }, [contactsOnNetwork, hasAddressBook, isContactsFeatureEnabled, recipientSearch.value]);
  const showContactSearchResult =
    hasSearchValue && selectedContact === undefined && contactSearchResult !== undefined;
  const showInitialState = !hasSearchValue && selectedContact === undefined;
  const showContactsList =
    showInitialState && isContactsFeatureEnabled && hasAddressBook && contactsOnNetwork.length > 0;
  const showEmptyContactsState =
    showInitialState &&
    isContactsFeatureEnabled &&
    hasAddressBook &&
    contactsOnNetwork.length === 0;

  const { clipboardAddress } = useClipboardRecipient({
    enabled: showInitialState,
    currency,
    account,
    parentAccount,
    transaction,
    currentAccountId: mainAccount.id,
    recipientSupportsDomain,
  });

  const handlePasteFromClipboard = useCallback(() => {
    if (clipboardAddress) {
      recipientSearch.setValue(clipboardAddress);
    }
  }, [clipboardAddress, recipientSearch]);

  const handleAddressSelect = useCallback(
    (address: string, ensName?: string) => {
      onAddressSelected(address, ensName);
    },
    [onAddressSelected],
  );

  const handleContactSelect = useCallback(
    (contact: Contact) => {
      const [address] = contact.addresses;
      if (contact.addresses.length === 1 && address) {
        handleAddressSelect(address.address);
        return;
      }

      setSelectedContact(contact);
    },
    [handleAddressSelect],
  );

  const handleContactAddressSelect = useCallback(
    (address: string) => {
      setSelectedContact(undefined);
      handleAddressSelect(address);
    },
    [handleAddressSelect],
  );

  const clearSelectedContact = useCallback(() => {
    setSelectedContact(undefined);
  }, []);

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
    network: mainAccount.currency,
    clipboardAddress,
    handlePasteFromClipboard,
    handleAddressSelect,
    handleContactSelect,
    handleContactAddressSelect,
    clearSelectedContact,
    isContactsFeatureEnabled,
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
