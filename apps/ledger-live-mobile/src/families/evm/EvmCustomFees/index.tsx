import React, { useCallback, useMemo } from "react";
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
  const {
    setTransaction,
    transaction: baseTransaction,
    gasOptions,
    goBackOnSetTransaction = true,
  } = route.params;
  const { account, parentAccount } = useSelector(accountScreenSelector(route));
  const navigation = useNavigation();
  invariant(account, "no account found");
  const mainAccount = getMainAccount(account, parentAccount);
  invariant(mainAccount, "no main account found");

  const bridge = getAccountBridge(mainAccount);

  const onValidateFees = useCallback(
    (transactionPatch: Partial<Transaction>) => () => {
      setTransaction(bridge.updateTransaction(route.params.transaction, transactionPatch));
      // In the context of some UI flows like the swap, the main component might already
      // be providing a navigation after updating the transaction. On those cases,
      // we'll remove the default "go back" behaviour and
      // let the parent UI decide how to navigate.
      if (goBackOnSetTransaction) {
        navigation.goBack();
      }
    },
    [bridge, navigation, route.params, setTransaction, goBackOnSetTransaction],
  );

  // The transaction might be coming without gasOptions already added to it, like for the swap flow
  //
  // TODO: Make the Evm1559CustomFees & EvmLegacyCustomFees Components capable of working without
  // GasOptions provided by just using fallback values like actual 1% of FeeData as min and
  // 10_000% of FeeData as max
  const transaction = useMemo(
    () => (baseTransaction.gasOptions ? baseTransaction : { ...baseTransaction, gasOptions }),
    [baseTransaction, gasOptions],
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
