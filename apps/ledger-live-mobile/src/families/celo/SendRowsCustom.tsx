import React, { useCallback } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { Account } from "@ledgerhq/types-live";
import { Transaction } from "@ledgerhq/live-common/generated/types";
import type {
  CeloAccount,
  Transaction as CeloTransaction,
} from "@ledgerhq/live-common/families/celo/types";
import { findSubAccountById } from "@ledgerhq/live-common/account/index";
import { FEE_CURRENCY_BY_CONTRACT } from "@ledgerhq/live-common/families/celo/logic";
import { ScreenName } from "~/const";
import SummaryRow from "~/screens/SendFunds/SummaryRow";
import LText from "~/components/LText";
import { Trans } from "~/context/Locale";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { SendFundsNavigatorStackParamList } from "~/components/RootNavigator/types/SendFundsNavigator";
import { SignTransactionNavigatorParamList } from "~/components/RootNavigator/types/SignTransactionNavigator";
import { SwapNavigatorParamList } from "~/components/RootNavigator/types/SwapNavigator";

type Navigation = BaseComposite<
  | StackNavigatorProps<SendFundsNavigatorStackParamList, ScreenName.SendSummary>
  | StackNavigatorProps<SignTransactionNavigatorParamList, ScreenName.SignTransactionSummary>
  | StackNavigatorProps<SwapNavigatorParamList, ScreenName.SwapSelectFees>
>;

type Props = {
  account: Account;
  transaction: Transaction;
} & Navigation;

export default function CeloSendRowsCustom({ account, transaction }: Props) {
  const navigation = useNavigation<Navigation["navigation"]>();
  const route = useRoute<Navigation["route"]>();
  const celoTransaction = transaction as CeloTransaction;
  const celoAccount = account as CeloAccount;

  const feeCurrencyAccount = celoTransaction.feeCurrencyAccountId
    ? findSubAccountById(celoAccount, celoTransaction.feeCurrencyAccountId)
    : null;

  const feeCurrencyName = feeCurrencyAccount
    ? FEE_CURRENCY_BY_CONTRACT.get(feeCurrencyAccount.token.contractAddress.toLowerCase())?.name ??
      "CELO"
    : "CELO";

  const editFeeCurrency = useCallback(() => {
    navigation.navigate(ScreenName.CeloEditFeeCurrency, {
      ...route.params,
      accountId: account.id,
      account: celoAccount,
      transaction: celoTransaction,
    });
  }, [navigation, route.params, account.id, celoAccount, celoTransaction]);

  return (
    <SummaryRow title={<Trans i18nKey="celo.send.feeCurrency" />} onPress={editFeeCurrency}>
      <LText semiBold onPress={editFeeCurrency}>
        {feeCurrencyName}
      </LText>
    </SummaryRow>
  );
}
