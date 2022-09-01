import React, { useCallback } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { Account } from "@ledgerhq/types-live";
import { Transaction } from "@ledgerhq/live-common/generated/types";
import type { Transaction as OsmosisTransaction } from "@ledgerhq/live-common/families/osmosis/types";
import type { CosmosAccount } from "@ledgerhq/live-common/families/cosmos/types";
import { ScreenName } from "../../const";
import CosmosFamilySendRowsCustomComponent from "../cosmos/shared/CosmosFamilySendRowsCustomComponent";
import {
  BaseComposite,
  StackNavigatorProps,
} from "../../components/RootNavigator/types/helpers";
import { LendingEnableFlowParamsList } from "../../components/RootNavigator/types/LendingEnableFlowNavigator";
import { LendingSupplyFlowNavigatorParamList } from "../../components/RootNavigator/types/LendingSupplyFlowNavigator";
import { LendingWithdrawFlowNavigatorParamList } from "../../components/RootNavigator/types/LendingWithdrawFlowNavigator";
import { SendFundsNavigatorStackParamList } from "../../components/RootNavigator/types/SendFundsNavigator";
import { SignTransactionNavigatorParamList } from "../../components/RootNavigator/types/SignTransactionNavigator";
import { SwapNavigatorParamList } from "../../components/RootNavigator/types/SwapNavigator";

type Navigation = BaseComposite<
  | StackNavigatorProps<
      SendFundsNavigatorStackParamList,
      ScreenName.SendSummary
    >
  | StackNavigatorProps<
      SignTransactionNavigatorParamList,
      ScreenName.SignTransactionSummary
    >
  | StackNavigatorProps<
      LendingEnableFlowParamsList,
      ScreenName.LendingEnableSummary
    >
  | StackNavigatorProps<
      LendingSupplyFlowNavigatorParamList,
      ScreenName.LendingSupplySummary
    >
  | StackNavigatorProps<
      LendingWithdrawFlowNavigatorParamList,
      ScreenName.LendingWithdrawSummary
    >
  | StackNavigatorProps<SwapNavigatorParamList, ScreenName.SwapSelectFees>
>;

type Props = {
  account: Account;
  transaction: Transaction;
} & Navigation;

export default function OsmosisSendRowsCustom(props: Props) {
  const { account } = props;
  const transaction = props.transaction as OsmosisTransaction;
  const navigation = useNavigation<Navigation["navigation"]>();
  const route = useRoute<Navigation["route"]>();
  const editMemo = useCallback(() => {
    navigation.navigate(ScreenName.CosmosFamilyEditMemo, {
      ...route.params,
      accountId: account.id,
      parentId: undefined,
      account: account as CosmosAccount,
      transaction,
    });
  }, [navigation, route.params, account, transaction]);

  return (
    <CosmosFamilySendRowsCustomComponent
      transaction={transaction}
      editMemo={editMemo}
    />
  );
}
