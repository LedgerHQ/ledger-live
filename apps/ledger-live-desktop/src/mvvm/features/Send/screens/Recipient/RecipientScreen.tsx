import React, { useCallback, useMemo } from "react";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import {
  useSendFlowData,
  useSendFlowActions,
  useSendFlowNavigation,
} from "../../context/SendFlowContext";
import { RecipientAddressModal } from "./components/RecipientAddressModal";

export function RecipientScreen() {
  const { state, uiConfig, recipientSearch } = useSendFlowData();
  const { transaction, close } = useSendFlowActions();
  const { navigation } = useSendFlowNavigation();

  const account = state.account.account;
  const parentAccount = state.account.parentAccount ?? undefined;

  const currency: CryptoCurrency | TokenCurrency | null = useMemo(() => {
    if (state.account.currency) return state.account.currency;
    return account ? getAccountCurrency(account) : null;
  }, [state.account.currency, account]);

  const handleAddressSelected = useCallback(
    (address: string, ensName?: string) => {
      transaction.setRecipient({
        address,
        ensName,
      });

      recipientSearch.clear();
      navigation.goToNextStep();
    },
    [transaction, navigation, recipientSearch],
  );

  if (!account || !currency) {
    return null;
  }

  return (
    <RecipientAddressModal
      isOpen
      onClose={close}
      account={account}
      parentAccount={parentAccount}
      currency={currency}
      onAddressSelected={handleAddressSelected}
      recipientSupportsDomain={uiConfig.recipientSupportsDomain}
    />
  );
}
