import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import type { Memo } from "@ledgerhq/live-common/flows/send/types";
import { useNavigation } from "@react-navigation/native";
import { useCallback, useMemo } from "react";
import { ScreenName } from "~/const";
import { useSendFlowActions, useSendFlowData } from "../../../context/SendFlowContext";
import type { SendFlowNavigationProp } from "../../../types";

type RecipientScreenViewModelBase = Readonly<{
  ready: false;
}>;

export type ReadyRecipientScreenViewModel = Readonly<{
  ready: true;
  account: AccountLike;
  parentAccount: Account | null;
  transaction: Transaction | null;
  currency: CryptoOrTokenCurrency;
  recipientSupportsDomain: boolean;
  onAddressSelected: (
    address: string,
    ensName?: string,
    goToNextStep?: boolean,
    memo?: Memo,
  ) => void;
}>;

export type RecipientScreenViewModel = RecipientScreenViewModelBase | ReadyRecipientScreenViewModel;

export function useRecipientScreenViewModel(): RecipientScreenViewModel {
  const { state, uiConfig } = useSendFlowData();
  const { transaction } = useSendFlowActions();
  const navigation = useNavigation<SendFlowNavigationProp>();

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

  const onAddressSelected = useCallback(
    (address: string, ensName?: string, goToNextStep = true, memo?: Memo) => {
      transaction.setRecipient({
        ...state.recipient,
        address,
        ensName,
        ...(memo ? { memo } : {}),
      });

      if (goToNextStep) {
        goToAmount();
      }
    },
    [transaction, state.recipient, goToAmount],
  );

  if (!account || !currency) {
    return { ready: false };
  }

  return {
    ready: true,
    account,
    parentAccount,
    transaction: state.transaction.transaction,
    currency,
    recipientSupportsDomain: uiConfig.recipientSupportsDomain,
    onAddressSelected,
  };
}
