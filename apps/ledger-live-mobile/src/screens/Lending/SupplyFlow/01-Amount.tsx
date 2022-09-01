import invariant from "invariant";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import React, { useCallback } from "react";
import { useSelector } from "react-redux";
import { findCompoundToken } from "@ledgerhq/live-common/currencies/index";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { useSupplyMax } from "@ledgerhq/live-common/compound/react";
import { CompositeScreenProps } from "@react-navigation/native";
import { accountScreenSelector } from "../../../reducers/accounts";
import { ScreenName } from "../../../const";
import AmountScreen from "../shared/01-Amount";
import LendingWarnings from "../shared/LendingWarnings";
import { StackNavigatorProps } from "../../../components/RootNavigator/types/helpers";
import { LendingSupplyFlowNavigatorParamList } from "../../../components/RootNavigator/types/LendingSupplyFlowNavigator";
import { BaseNavigatorStackParamList } from "../../../components/RootNavigator/types/BaseNavigator";

type NavigationProps = CompositeScreenProps<
  StackNavigatorProps<
    LendingSupplyFlowNavigatorParamList,
    ScreenName.LendingSupplyAmount
  >,
  StackNavigatorProps<BaseNavigatorStackParamList>
>;

export default function SupplyAmount({ navigation, route }: NavigationProps) {
  const { account, parentAccount } = useSelector(accountScreenSelector(route));
  invariant(
    account && account.type === "TokenAccount",
    "token account required",
  );
  const max = useSupplyMax(account);
  const { transaction, setTransaction, status, bridgePending, bridgeError } =
    useBridgeTransaction(() => {
      const bridge = getAccountBridge(account, parentAccount);
      const ctoken = findCompoundToken(account.token);

      const t = bridge.createTransaction(account);
      const transaction = bridge.updateTransaction(t, {
        recipient: ctoken?.contractAddress || "",
        mode: "compound.supply",
        subAccountId: account.id,
        amount: max,
        gasPrice: null,
        userGasLimit: null,
      });
      return {
        account,
        parentAccount,
        transaction,
      };
    });
  invariant(transaction, "transaction required");
  const onContinue = useCallback(() => {
    navigation.navigate(ScreenName.LendingSupplySummary, {
      ...route.params,
      accountId: account.id,
      parentId: parentAccount?.id,
      transaction,
      currentNavigation: ScreenName.LendingSupplySummary,
      nextNavigation: ScreenName.LendingSupplySelectDevice,
      hideTotal: true,
    });
  }, [account.id, navigation, parentAccount, route.params, transaction]);
  return (
    <>
      <LendingWarnings />
      <AmountScreen
        navigation={navigation}
        route={route}
        transaction={transaction}
        setTransaction={setTransaction}
        status={status}
        bridgePending={bridgePending}
        bridgeError={bridgeError}
        max={max}
        onContinue={onContinue}
        category={"Lend Supply"}
      />
    </>
  );
}
