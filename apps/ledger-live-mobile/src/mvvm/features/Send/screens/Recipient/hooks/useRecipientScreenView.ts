import { useContacts, useContactsFeature } from "@features/platform-contacts";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor/send/features";
import { isEligibleAddressCurrency } from "@ledgerhq/live-common/flows/send/recipient/utils/isEligibleAddressCurrency";
import { useRecipientSearchState } from "@ledgerhq/live-common/flows/send/recipient/hooks/useRecipientSearchState";
import { filterContactsByNetwork } from "@ledgerhq/live-common/flows/send/recipient/utils/filterContactsByNetwork";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { TokenCurrency } from "@domain/entity-currency-token";
import type { Contact, ContactAddress } from "@domain/entity-contact";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Memo } from "@ledgerhq/live-common/flows/send/types";
import { useCallback, useMemo, useState } from "react";
import { useContactAddressPicker } from "LLM/features/Contacts/hooks/useContactAddressPicker";
import { useSendFlowData } from "../../../context/SendFlowContext";
import { useSendMemoReset } from "../../../context/SendMemoResetContext";
import { useRecipientContactSelection } from "../../../context/RecipientContactSelectionContext";
import { useDoNotAskAgainSkipMemo } from "../../../hooks/useDoNotAskAgainSkipMemo";
import { useContactsFeatureIntroductionViewModel } from "./useContactsFeatureIntroductionViewModel";
import { useAddressValidation } from "./useAddressValidation";
import { useClipboardRecipient } from "./useClipboardRecipient";

type UseRecipientScreenViewProps = Readonly<{
  account: AccountLike;
  parentAccount?: Account | null;
  transaction?: Transaction | null;
  currency: CryptoCurrency | TokenCurrency;
  onAddressSelected: (
    address: string,
    ensName?: string,
    goToNextStep?: boolean,
    memo?: Memo,
  ) => void;
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
  const { recipientSearch, state } = useSendFlowData();
  const contacts = useContacts();
  const { isEnabled: isContactsFeatureEnabled, eligibleAddressFamilies } =
    useContactsFeature("mobile");
  const { selectedContact } = useRecipientContactSelection();
  const [doNotAskAgainSkipMemo] = useDoNotAskAgainSkipMemo();
  const { markMemoSkipped } = useSendMemoReset();
  const [isSkipMemoConfirmationOpen, setIsSkipMemoConfirmationOpen] = useState(false);

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

  const resolvedAddress = result.resolvedAddress ?? recipientSearch.value;
  const hasMemo = sendFeatures.hasMemoForRecipient(currency, resolvedAddress);
  const hasFilledMemo = useMemo(() => {
    if (!hasMemo) return true;
    const memo = state.recipient?.memo;
    if (!memo) return false;
    if (memo.type === "NO_MEMO") return true;
    return memo.value.length > 0;
  }, [hasMemo, state.recipient?.memo]);

  const closeSkipMemoConfirmation = useCallback(() => {
    setIsSkipMemoConfirmationOpen(false);
  }, []);

  const handleAddressSelect = useCallback(
    (address: string, ensName?: string) => {
      if (hasMemo && !hasFilledMemo) {
        if (doNotAskAgainSkipMemo) {
          markMemoSkipped();
          onAddressSelected(address, ensName, true, { value: "", type: "NO_MEMO" });
          return;
        }

        onAddressSelected(address, ensName, false);
        setIsSkipMemoConfirmationOpen(true);
        return;
      }

      onAddressSelected(address, ensName, true);
    },
    [doNotAskAgainSkipMemo, hasFilledMemo, hasMemo, markMemoSkipped, onAddressSelected],
  );

  const handleContactAddressSelect = useCallback(
    (address: ContactAddress) => {
      handleAddressSelect(address.address);
    },
    [handleAddressSelect],
  );
  const { open: openPicker, contactAddressPicker } = useContactAddressPicker({
    onSelectAddress: handleContactAddressSelect,
  });

  const handleContactSelect = useCallback(
    (contact: Contact) => {
      openPicker(contact);
    },
    [openPicker],
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
    isSkipMemoConfirmationOpen,
    closeSkipMemoConfirmation,
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
