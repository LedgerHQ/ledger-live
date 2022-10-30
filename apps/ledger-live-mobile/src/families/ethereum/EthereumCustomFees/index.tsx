import React, { useCallback } from "react";
import invariant from "invariant";
import { Trans } from "react-i18next";
import { useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { getMainAccount } from "@ledgerhq/live-common/account/helpers";
import { Transaction } from "@ledgerhq/live-common/families/ethereum/types";
import { EIP1559ShouldBeUsed } from "@ledgerhq/live-common/families/ethereum/transaction";
import { accountScreenSelector } from "../../../reducers/accounts";
import EthereumLegacyCustomFees from "./EthereumLegacyCustomFees";
import { Props as RouteParams } from "../EthereumFeesStrategy";
import Ethereum1559CustomFees from "./Ethereum1559CustomFees";

type Props = {
  route: {
    params: RouteParams;
  };
};

const options = {
  title: <Trans i18nKey="send.summary.fees" />,
  headerLeft: null,
};

export default function EthereumCustomFees({ route }: Props) {
  const { setTransaction, transaction, status } = route.params;
  const { account, parentAccount } = useSelector(accountScreenSelector(route));
  const navigation = useNavigation();
  invariant(account, "no account found");

  const mainAccount = getMainAccount(account, parentAccount);
  const bridge = getAccountBridge(account, parentAccount);

  const onValidateFees = useCallback(
    (transactionPatch: Partial<Transaction>) => () => {
      setTransaction(
        bridge.updateTransaction(route.params.transaction, transactionPatch),
      );
      navigation.goBack();
    },
    [bridge, navigation, route.params, setTransaction],
  );

  return EIP1559ShouldBeUsed(mainAccount.currency) ? (
    <Ethereum1559CustomFees
      account={account}
      parentAccount={parentAccount}
      transaction={transaction}
      onValidateFees={onValidateFees}
      status={status}
    />
  ) : (
    <EthereumLegacyCustomFees
      account={account}
      parentAccount={parentAccount}
      transaction={transaction}
      onValidateFees={onValidateFees}
      status={status}
    />
  );
}
export { options, EthereumCustomFees as component };
