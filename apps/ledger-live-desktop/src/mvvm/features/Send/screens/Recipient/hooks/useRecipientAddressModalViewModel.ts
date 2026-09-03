import { useCallback, useMemo } from "react";
import { useContacts, useContactsFeature } from "@features/platform-contacts";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { isEligibleAddressCurrency } from "@ledgerhq/live-common/flows/send/recipient/utils/isEligibleAddressCurrency";
import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor/send/features";
import { useRecipientSearchState } from "@ledgerhq/live-common/flows/send/recipient/hooks/useRecipientSearchState";
import { filterContactsByNetwork } from "@ledgerhq/live-common/flows/send/recipient/utils/filterContactsByNetwork";
import { pickContactAddressForCurrency } from "@ledgerhq/live-common/flows/send/recipient/utils/pickContactAddressForCurrency";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { TokenCurrency } from "@domain/entity-currency-token";
import type { Contact } from "@domain/entity-contact";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import {
  SEND_FLOW_STEP,
  type Memo,
  type SendFlowStep,
} from "@ledgerhq/live-common/flows/send/types";
import { useFlowWizard } from "../../../../FlowWizard/FlowWizardContext";
import { useSendFlowData } from "../../../context/SendFlowContext";
import { useAddressValidation } from "./useAddressValidation";
import { useAddressMatchedSectionViewModel } from "./useAddressMatchedSectionViewModel";
import { useDoNotAskAgainSkipMemo } from "../../../hooks/useDoNotAskAgainSkipMemo";
import { track } from "~/renderer/analytics/segment";
import { getSendFlowTrackingProperties } from "../../../utils/tracking";
import { useRecipientContactSelection } from "../../../context/RecipientContactSelectionContext";
import { useContactsFeatureIntroductionViewModel } from "./useContactsFeatureIntroductionViewModel";

type UseRecipientAddressModalViewModelProps = Readonly<{
  account: AccountLike;
  parentAccount?: Account;
  currency: CryptoCurrency | TokenCurrency;
  onAddressSelected: (
    address: string,
    ensName?: string,
    goToNextStep?: boolean,
    memo?: Memo,
  ) => void;
  recipientSupportsDomain: boolean;
}>;

export function useRecipientAddressModalViewModel({
  account,
  parentAccount,
  currency,
  onAddressSelected,
  recipientSupportsDomain,
}: UseRecipientAddressModalViewModelProps) {
  const { recipientSearch, state } = useSendFlowData();
  const contacts = useContacts();
  const [doNotAskAgainSkipMemo] = useDoNotAskAgainSkipMemo();
  const { isEnabled: isContactsFeatureEnabled, eligibleAddressFamilies } =
    useContactsFeature("desktop");
  const { selectedContact, selectContact, clearSelectedContact } = useRecipientContactSelection();
  const { navigation } = useFlowWizard<SendFlowStep>();

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
    transaction: state.transaction.transaction,
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

  const hasMemo = sendFeatures.hasMemoForRecipient(currency, recipientSearch.value);
  const memoType = sendFeatures.getMemoType(currency);
  const memoTypeOptions = sendFeatures.getMemoOptions(currency);
  const memoDefaultOption = sendFeatures.getMemoDefaultOption(currency);
  const memoMaxLength = sendFeatures.getMemoMaxLength(currency);

  const hasMemoValidationError = useMemo(() => {
    if (!hasMemo) return false;
    return Boolean(state.transaction.status.errors.transaction);
  }, [hasMemo, state.transaction.status.errors.transaction]);

  const hasFilledMemo = useMemo(() => {
    if (!hasMemo) return true;
    const memo = state.recipient?.memo;
    if (!memo) return false;
    if (memo.type === "NO_MEMO") return true;
    return memo.value.length > 0;
  }, [hasMemo, state.recipient?.memo]);

  // Coming back to this step remounts the screen, which restarts the sanction and
  // bridge validations from scratch. Trust the recipient already stored in the flow
  // so dependent UI (memo field) doesn't blink while it revalidates.
  const isAlreadyValidatedRecipient = useMemo(() => {
    const searchedValue = recipientSearch.value.trim().toLowerCase();
    if (!searchedValue) return false;
    const validatedAddress = state.recipient?.address?.trim().toLowerCase();
    const validatedEnsName = state.recipient?.ensName?.trim().toLowerCase();
    return searchedValue === validatedAddress || searchedValue === validatedEnsName;
  }, [recipientSearch.value, state.recipient?.address, state.recipient?.ensName]);

  const handleAddressSelect = useCallback(
    (address: string, ensName?: string) => {
      track("button_clicked", {
        button: "address matched",
        page: "step recipient",
        ...sendFlowTrackingProperties,
      });

      if (hasMemo && !hasFilledMemo) {
        if (doNotAskAgainSkipMemo) {
          onAddressSelected(address, ensName, true, { value: "", type: "NO_MEMO" });
          return;
        }

        onAddressSelected(address, ensName);
        navigation.goToStep(SEND_FLOW_STEP.SKIP_MEMO_CONFIRMATION);
        return;
      }

      onAddressSelected(address, ensName, true);
    },
    [
      doNotAskAgainSkipMemo,
      hasFilledMemo,
      hasMemo,
      navigation,
      onAddressSelected,
      sendFlowTrackingProperties,
    ],
  );

  const handleContactSelect = useCallback(
    (contact: Contact) => {
      const address = pickContactAddressForCurrency(contact.addresses, currency.id);
      if (address) {
        handleAddressSelect(address.address);
        return;
      }

      selectContact(contact);
    },
    [currency.id, handleAddressSelect, selectContact],
  );

  const handleContactAddressSelect = useCallback(
    (address: string) => {
      clearSelectedContact();
      handleAddressSelect(address);
    },
    [clearSelectedContact, handleAddressSelect],
  );

  const handleAddContact = useCallback(() => {
    navigation.goToStep(SEND_FLOW_STEP.ADD_CONTACT);
  }, [navigation]);

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
  const addressMatchedSectionViewModel = useAddressMatchedSectionViewModel({
    searchResult: result,
    searchValue: recipientSearch.value,
    onSelect: handleAddressSelect,
    onAddContact: handleAddContact,
    isSanctioned: searchState.isSanctioned,
    isAddressComplete: searchState.isAddressComplete,
    hasBridgeError: searchState.showBridgeRecipientError,
    isContactsFeatureEnabled,
    hasAddressBook,
    addressBookFamilyName: mainAccount.currency.name,
  });

  return {
    searchValue: recipientSearch.value,
    isLoading: !shouldHideRegularSearchState && isLoading,
    result,
    showInitialState,
    showContactsList,
    showContactSearchResult,
    showEmptyContactsState,
    contactsOnNetwork,
    contactSearchResult,
    selectedContact,
    network: mainAccount.currency,
    handleAddressSelect,
    handleContactSelect,
    handleContactAddressSelect,
    hasMemo,
    hasMemoValidationError,
    hasFilledMemo,
    isContactsFeatureEnabled,
    featureIntroduction,
    addressMatchedSectionViewModel,
    memoType,
    memoTypeOptions,
    memoDefaultOption,
    memoMaxLength,
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
    isAddressValid:
      isAlreadyValidatedRecipient || (!shouldHideRegularSearchState && searchState.isAddressValid),
  };
}
