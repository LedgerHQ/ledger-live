import React, { useCallback } from "react";
import invariant from "invariant";
import { Trans } from "react-i18next";
import { useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { Transaction } from "@ledgerhq/coin-evm/types/index";
import type { Account } from "@ledgerhq/types-live";

import { SendFundsNavigatorStackParamList } from "../../../components/RootNavigator/types/SendFundsNavigator";
import { accountScreenSelector } from "../../../reducers/accounts";
import EvmLegacyCustomFees from "./EvmLegacyCustomFees";
import Evm1559CustomFees from "./Evm1559CustomFees";
import {
  BaseComposite,
  StackNavigatorProps,
} from "../../../components/RootNavigator/types/helpers";
import { ScreenName } from "../../../const";

type Props = BaseComposite<
  StackNavigatorProps<SendFundsNavigatorStackParamList, ScreenName.EvmCustomFees>
>;

const options = {
  title: <Trans i18nKey="send.summary.fees" />,
  headerLeft: null,
};

export default function EvmCustomFees({ route }: Props) {
  const { setTransaction, transaction, transactionRaw } = route.params;
  const { account, parentAccount } = useSelector(accountScreenSelector(route));
  const navigation = useNavigation();

  invariant(account, "no account found");

  const bridge = getAccountBridge(account, parentAccount);

  const onValidateFees = useCallback(
    (transactionPatch: Partial<Transaction>) => () => {
      setTransaction(bridge.updateTransaction(transaction, transactionPatch));
      navigation.goBack();
    },
    [bridge, navigation, transaction, setTransaction],
  );

  return transaction.type === 2 ? (
    <Evm1559CustomFees
      account={account as Account}
      transaction={transaction}
      onValidateFees={onValidateFees}
    />
  ) : (
    <EvmLegacyCustomFees
      account={account as Account}
      parentAccount={parentAccount}
      transaction={transaction as Transaction}
      onValidateFees={onValidateFees}
      transactionRaw={transactionRaw}
    />
  );
}

export { options, EvmCustomFees as component };
