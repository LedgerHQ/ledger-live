import { useCallback, useMemo } from "react";
import { useContacts, useContactsFeature } from "@features/platform-contacts";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor/send/features";
import { useRecipientSearchState } from "@ledgerhq/live-common/flows/send/recipient/hooks/useRecipientSearchState";
import { resolveRecipientNetworkId } from "@ledgerhq/live-common/flows/send/recipient/utils/resolveRecipientNetworkId";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { TokenCurrency } from "@domain/entity-currency-token";
import type { Contact } from "@domain/entity-contact";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { SEND_FLOW_STEP, type SendFlowStep } from "@ledgerhq/live-common/flows/send/types";
import { useFlowWizard } from "../../../../FlowWizard/FlowWizardContext";
import { useSendFlowData } from "../../../context/SendFlowContext";
import { useAddressValidation } from "./useAddressValidation";
import { useAddressMatchedSectionViewModel } from "./useAddressMatchedSectionViewModel";
import { track } from "~/renderer/analytics/segment";
import { getSendFlowTrackingProperties } from "../../../utils/tracking";

type UseRecipientAddressModalViewModelProps = Readonly<{
  account: AccountLike;
  parentAccount?: Account;
  currency: CryptoCurrency | TokenCurrency;
  onAddressSelected: (address: string, ensName?: string, goToNextStep?: boolean) => void;
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
  const { isEnabled: isContactsFeatureEnabled } = useContactsFeature("desktop");
  const { navigation } = useFlowWizard<SendFlowStep>();

  const mainAccount = getMainAccount(account, parentAccount);
  const hasAddressBook = sendFeatures.hasAddressBook(currency);
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

  const hasMemo = sendFeatures.hasMemo(currency);
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

  const handleAddressSelect = useCallback(
    (address: string, ensName?: string) => {
      track("button_clicked", {
        button: "address matched",
        page: "step recipient",
        ...sendFlowTrackingProperties,
      });
      onAddressSelected(address, ensName, true);
    },
    [onAddressSelected, sendFlowTrackingProperties],
  );

  const handleContactSelect = useCallback(
    (contact: Contact) => {
      const [address] = contact.addresses;
      if (address) {
        handleAddressSelect(address.address);
      }
    },
    [handleAddressSelect],
  );

  const handleAddContact = useCallback(() => {
    navigation.goToStep(SEND_FLOW_STEP.ADD_CONTACT);
  }, [navigation]);

  const searchState = useRecipientSearchState({
    searchValue: recipientSearch.value,
    result,
    isLoading,
    recipientSupportsDomain,
  });

  const addressBookFamilyName = mainAccount.currency.name;
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
    addressBookFamilyName,
  });

  return {
    searchValue: recipientSearch.value,
    isLoading,
    result,
    showInitialState,
    showContactsList,
    showEmptyContactsState,
    contactsOnNetwork,
    handleAddressSelect,
    handleContactSelect,
    hasMemo,
    hasMemoValidationError,
    hasFilledMemo,
    isContactsFeatureEnabled,
    hasAddressBook,
    addressBookFamilyName,
    addressMatchedSectionViewModel,
    memoType,
    memoTypeOptions,
    memoDefaultOption,
    memoMaxLength,
    ...searchState,
  };
}
