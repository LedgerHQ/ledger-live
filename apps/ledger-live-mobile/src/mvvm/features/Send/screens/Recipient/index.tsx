import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { useNavigation } from "@react-navigation/native";
import React, { useCallback, useMemo } from "react";
import { ScreenName } from "~/const";
import { useSendFlowActions, useSendFlowData } from "../../context/SendFlowContext";
import { SendFlowNavigationProp } from "../../types";
import { RecipientScreenView } from "./components/RecipientScreenView";

export function RecipientScreen() {
  const { state, uiConfig, recipientSearch } = useSendFlowData();
  const { transaction } = useSendFlowActions();
  const navigation = useNavigation<SendFlowNavigationProp>();

  const account = state.account.account;
  const parentAccount = state.account.parentAccount;

  const currency: CryptoOrTokenCurrency | null = useMemo(() => {
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
      navigation.navigate(ScreenName.SendFlowAmount);
    },
    [transaction, recipientSearch, navigation],
  );

  if (!account || !currency) {
    return null;
  }

  return (
    <RecipientScreenView
      account={account}
      parentAccount={parentAccount}
      currency={currency}
      onAddressSelected={handleAddressSelected}
      recipientSupportsDomain={uiConfig.recipientSupportsDomain}
    />
  );
}
