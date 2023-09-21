import React, { useCallback } from "react";
import invariant from "invariant";
import { Trans } from "react-i18next";
import { useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { Transaction } from "@ledgerhq/coin-evm/types/index";
import { SendFundsNavigatorStackParamList } from "../../../components/RootNavigator/types/SendFundsNavigator";
import { accountScreenSelector } from "../../../reducers/accounts";
import EvmLegacyCustomFees from "./EvmLegacyCustomFees";
import Evm1559CustomFees from "./Evm1559CustomFees";
import {
  BaseComposite,
  StackNavigatorProps,
} from "../../../components/RootNavigator/types/helpers";
import { ScreenName } from "../../../const";
import { getMainAccount } from "@ledgerhq/coin-framework/account/helpers";

type Props = BaseComposite<
  StackNavigatorProps<SendFundsNavigatorStackParamList, ScreenName.EvmCustomFees>
>;

const options = {
  title: <Trans i18nKey="send.summary.fees" />,
  headerLeft: null,
};

export default function EvmCustomFees({ route }: Props) {
  const { setCustomStrategyTransactionPatch, setTransaction, transaction } = route.params;
  const { account, parentAccount } = useSelector(accountScreenSelector(route));
  const navigation = useNavigation();
  invariant(account, "no account found");
  const mainAccount = getMainAccount(account, parentAccount);
  invariant(mainAccount, "no main account found");

  const bridge = getAccountBridge(mainAccount);

  const onValidateFees = useCallback(
    (transactionPatch: Partial<Transaction>) => () => {
      setTransaction(bridge.updateTransaction(route.params.transaction, transactionPatch));
      setCustomStrategyTransactionPatch(transactionPatch);
      navigation.goBack();
    },
    [bridge, navigation, route.params, setTransaction, setCustomStrategyTransactionPatch],
  );

  const shouldUseEip1559 = transaction.type === 2;

  return shouldUseEip1559 ? (
    <Evm1559CustomFees
      account={mainAccount}
      transaction={transaction}
      onValidateFees={onValidateFees}
    />
  ) : (
    <EvmLegacyCustomFees
      account={mainAccount}
      transaction={transaction}
      onValidateFees={onValidateFees}
    />
  );
}
export { options, EvmCustomFees as component };
