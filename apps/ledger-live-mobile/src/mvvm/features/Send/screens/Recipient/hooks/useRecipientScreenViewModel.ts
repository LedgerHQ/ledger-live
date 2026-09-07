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
import { useModularDrawerController } from "LLM/features/ModularDrawer";
import { PAY_ACCOUNT_UI_USE_CASE } from "LLM/features/ModularDrawer/types";
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
  const { state, uiConfig, recipientSearch, selectContactBeforeAccount } = useSendFlowData();
  const { transaction, setAccountAndNavigate } = useSendFlowActions();
  const navigation = useNavigation<BaseNavigationComposite<SendFlowNavigationProp>>();
  const storedContacts = useContacts();
  const contacts = useMemo(() => storedContacts.filter(contact => !contact.isMe), [storedContacts]);
  const { openDrawer } = useModularDrawerController();

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
      openDrawer({
        currencies: [address.currencyId],
        flow: "send",
        source: "Pay",
        areCurrenciesFiltered: true,
        enableAccountSelection: true,
        uiUseCase: PAY_ACCOUNT_UI_USE_CASE,
        onAccountSelected: (selectedAccount, selectedParentAccount) => {
          void Promise.resolve(
            setAccountAndNavigate(selectedAccount, selectedParentAccount, address.address),
          ).then(() => {
            goToAmount();
          });
        },
      });
    },
    [goToAmount, openDrawer, setAccountAndNavigate],
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

  if (selectContactBeforeAccount) {
    return {
      ready: true,
      mode: "selectContactBeforeAccount",
      contacts,
      onSelectContact,
      contactAddressPicker,
    };
  }

  if (!account || !currency) {
    return { ready: false };
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
