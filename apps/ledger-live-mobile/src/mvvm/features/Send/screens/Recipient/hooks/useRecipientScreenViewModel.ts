import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import type { Contact, ContactAddress } from "@domain/entity-contact";
import type { ContactAddressPickerProps } from "@features/flow-pay-contact";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import { useContacts } from "@features/platform-contacts";
import { useNavigation } from "@react-navigation/native";
import { useCallback, useMemo } from "react";
import { ScreenName } from "~/const";
import type { BaseNavigationComposite } from "~/components/RootNavigator/types/helpers";
import { useContactAddressPicker } from "LLM/features/Contacts/hooks/useContactAddressPicker";
import { useOpenSendFlow } from "LLM/features/Send/hooks/useOpenSendFlow";
import { useSendContactsFirst } from "../../../context/SendContactsFirstContext";
import { useSendFlowActions, useSendFlowData } from "../../../context/SendFlowContext";
import type { SendFlowNavigationProp } from "../../../types";

type RecipientScreenViewModelBase = Readonly<{
  ready: false;
}>;

export type ContactsFirstRecipientScreenViewModel = Readonly<{
  ready: true;
  mode: "selectContactBeforeAccount";
  contacts: readonly Contact[];
  onSelectContact: (contact: Contact) => void;
  contactAddressPicker: ContactAddressPickerProps;
}>;

export type ReadyRecipientScreenViewModel = Readonly<{
  ready: true;
  mode: "account";
  account: AccountLike;
  parentAccount: Account | null;
  transaction: Transaction | null;
  currency: CryptoOrTokenCurrency;
  recipientSupportsDomain: boolean;
  onAddressSelected: (address: string, ensName?: string) => void;
  onMemoProceed: () => void;
}>;

export type RecipientScreenViewModel =
  | RecipientScreenViewModelBase
  | ContactsFirstRecipientScreenViewModel
  | ReadyRecipientScreenViewModel;

export function useRecipientScreenViewModel(): RecipientScreenViewModel {
  const { state, uiConfig, recipientSearch } = useSendFlowData();
  const { transaction } = useSendFlowActions();
  const navigation = useNavigation<BaseNavigationComposite<SendFlowNavigationProp>>();
  const selectContactBeforeAccount = useSendContactsFirst();
  const storedContacts = useContacts();
  const contacts = useMemo(
    () => storedContacts.filter(contact => !contact.isMe && contact.addresses.length > 0),
    [storedContacts],
  );
  const { handleOpenSendFlow } = useOpenSendFlow({
    sourceScreenName: "Pay",
  });

  const account = state.account.account;
  const parentAccount = state.account.parentAccount ?? null;
  const currency = useMemo(
    () => state.account.currency ?? (account ? getAccountCurrency(account) : null),
    [state.account.currency, account],
  );

  const goToAmount = useCallback(() => {
    const { routes, index } = navigation.getState();
    if (routes[index - 1]?.name === ScreenName.SendFlowAmount) {
      navigation.goBack();
      return;
    }
    navigation.navigate(ScreenName.SendFlowAmount);
  }, [navigation]);

  const onMemoProceed = useCallback(() => {
    recipientSearch.clear();
    goToAmount();
  }, [recipientSearch, goToAmount]);

  const onAddressSelected = useCallback(
    (address: string, ensName?: string) => {
      transaction.setRecipient({ address, ensName, memo: state.recipient?.memo });
      recipientSearch.clear();
      goToAmount();
    },
    [transaction, state.recipient?.memo, recipientSearch, goToAmount],
  );

  const onSelectAddress = useCallback(
    (address: ContactAddress) => {
      handleOpenSendFlow({
        currencyIds: [address.currencyId],
        recipient: address.address,
        skipRecipientStep: true,
      });
    },
    [handleOpenSendFlow],
  );

  const { open: openPicker, contactAddressPicker } = useContactAddressPicker({
    onSelectAddress,
  });

  const onSelectContact = useCallback(
    (contact: Contact) => {
      openPicker(contact);
    },
    [openPicker],
  );

  if (!account || !currency) {
    if (!selectContactBeforeAccount) {
      return { ready: false };
    }

    return {
      ready: true,
      mode: "selectContactBeforeAccount",
      contacts,
      onSelectContact,
      contactAddressPicker,
    };
  }

  return {
    ready: true,
    mode: "account",
    account,
    parentAccount,
    transaction: state.transaction.transaction,
    currency,
    recipientSupportsDomain: uiConfig.recipientSupportsDomain,
    onAddressSelected,
    onMemoProceed,
  };
}
