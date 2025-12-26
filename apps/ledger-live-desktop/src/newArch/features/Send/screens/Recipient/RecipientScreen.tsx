import React, { useCallback, useMemo } from "react";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { useSendFlowContext } from "../../context/SendFlowContext";
import { RecipientAddressModal } from "./components/RecipientAddressModal";

export function RecipientScreen() {
  const { state, transaction, navigation, close, uiConfig } = useSendFlowContext();

  const account = state.account.account;
  const parentAccount = state.account.parentAccount ?? undefined;

  const currency: CryptoCurrency | TokenCurrency | null = useMemo(() => {
    if (state.account.currency) return state.account.currency;
    return account ? getAccountCurrency(account) : null;
  }, [state.account.currency, account]);

  const handleAddressSelected = useCallback(
    (address: string, ensName?: string, goToNextStep?: boolean) => {
      transaction.setRecipient({
        address,
        ensName,
      });

      if (goToNextStep) {
        navigation.goToNextStep();
      }
    },
    [transaction, navigation],
  );

  if (!account || !currency) {
    return null;
    // Account selection step should guarantee both account and currency are defined
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
