import { useContacts, useContactsFeature } from "@features/platform-contacts";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { isEligibleAddressCurrency } from "@ledgerhq/live-common/flows/send/recipient/utils/isEligibleAddressCurrency";
import { useRecipientSearchState } from "@ledgerhq/live-common/flows/send/recipient/hooks/useRecipientSearchState";
import { filterContactsByNetwork } from "@ledgerhq/live-common/flows/send/recipient/utils/filterContactsByNetwork";
import { pickContactAddressForCurrency } from "@ledgerhq/live-common/flows/send/recipient/utils/pickContactAddressForCurrency";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { TokenCurrency } from "@domain/entity-currency-token";
import type { Contact } from "@domain/entity-contact";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSendFlowData } from "../../../context/SendFlowContext";
import { useRecipientContactSelection } from "../../../context/RecipientContactSelectionContext";
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
  const [pendingContactAddress, setPendingContactAddress] = useState<string>();

  const mainAccount = getMainAccount(account, parentAccount);
  const hasAddressBook = isEligibleAddressCurrency(eligibleAddressFamilies, currency);

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

  const handlePasteFromClipboard = useCallback(() => {
    if (clipboardAddress) {
      recipientSearch.setValue(clipboardAddress);
    }
  }, [clipboardAddress, recipientSearch]);

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
      const address = pickContactAddressForCurrency(contact.addresses, currency.id);
      if (address) {
        validateContactAddress(address.address);
        return;
      }

      selectContact(contact);
    },
    [currency.id, selectContact, validateContactAddress],
  );

  const handleContactAddressSelect = useCallback(
    (address: string) => {
      clearSelectedContact();
      validateContactAddress(address);
    },
    [clearSelectedContact, validateContactAddress],
  );

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
