import { useContacts, useContactsFeature } from "@features/platform-contacts";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor/send/features";
import { useRecipientSearchState } from "@ledgerhq/live-common/flows/send/recipient/hooks/useRecipientSearchState";
import { pickContactAddressForCurrency } from "@ledgerhq/live-common/flows/send/recipient/utils/pickContactAddressForCurrency";
import { resolveRecipientNetworkId } from "@ledgerhq/live-common/flows/send/recipient/utils/resolveRecipientNetworkId";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { TokenCurrency } from "@domain/entity-currency-token";
import type { Contact } from "@domain/entity-contact";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { useCallback, useMemo } from "react";
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

  const contactsOnNetwork = useMemo(() => {
    const networkId = resolveRecipientNetworkId(currency.id);

    return contacts.reduce<Contact[]>((matchingContacts, contact) => {
      if (contact.isMe) {
        return matchingContacts;
      }

      const addresses = contact.addresses.filter(
        address => resolveRecipientNetworkId(address.currencyId) === networkId,
      );
      if (addresses.length === 0) {
        return matchingContacts;
      }

      matchingContacts.push({ ...contact, addresses });
      return matchingContacts;
    }, []);
  }, [contacts, currency.id]);

  const hasSearchValue = recipientSearch.value.length > 0;
  const showInitialState = !hasSearchValue;
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
      onAddressSelected(address, ensName);
    },
    [onAddressSelected],
  );

  const handleContactSelect = useCallback(
    (contact: Contact) => {
      const address = pickContactAddressForCurrency(contact.addresses, currency.id);
      if (address) {
        handleAddressSelect(address.address);
      }
    },
    [currency.id, handleAddressSelect],
  );

  const searchState = useRecipientSearchState({
    searchValue: recipientSearch.value,
    result,
    isLoading,
    recipientSupportsDomain,
  });

  return {
    searchValue: recipientSearch.value,
    isLoading,
    result,
    mainAccount,
    hasAddressBook,
    addressBookFamilyName: mainAccount.currency.name,
    showInitialState,
    showContactsList,
    showEmptyContactsState,
    contactsOnNetwork,
    clipboardAddress,
    handlePasteFromClipboard,
    handleAddressSelect,
    handleContactSelect,
    isContactsFeatureEnabled,
    ...searchState,
  };
}
