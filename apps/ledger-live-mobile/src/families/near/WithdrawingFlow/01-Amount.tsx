import invariant from "invariant";
import React from "react";
import { useSelector } from "react-redux";
import { BigNumber } from "bignumber.js";
import type { Transaction, NearAccount } from "@ledgerhq/live-common/families/near/types";
import { getMaxAmount } from "@ledgerhq/live-common/families/near/logic";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { accountScreenSelector } from "~/reducers/accounts";
import SelectAmount from "../shared/02-SelectAmount";
import { ScreenName } from "~/const";
import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { NearWithdrawingFlowParamList } from "./types";

type Props = BaseComposite<
  StackNavigatorProps<NearWithdrawingFlowParamList, ScreenName.NearWithdrawingAmount>
>;

function WithdrawingAmount({ navigation, route }: Props) {
  const { account } = useSelector(accountScreenSelector(route));
  invariant(account, "account required");
  const bridge = getAccountBridge(account, undefined);
  const mainAccount = getMainAccount(account, undefined);
  const { validatorId } = route.params.stakingPosition;
  const {
    transaction: bridgeTransaction,
    updateTransaction,
    status,
    bridgePending,
  } = useBridgeTransaction(() => {
    const t = bridge.createTransaction(mainAccount);
    return {
      account,
      transaction: bridge.updateTransaction(t, {
        mode: "withdraw",
        recipient: validatorId || "",
      }),
    };
  });
  const transaction = bridgeTransaction as Transaction;
  const newRoute = {
    ...route,
    params: {
      ...route.params,
      transaction,
      max: getMaxAmount(account as NearAccount, transaction, transaction?.fees),
      value: transaction ? transaction.amount : new BigNumber(0),
      nextScreen: ScreenName.NearWithdrawingSelectDevice,
      updateTransaction,
      status,
      bridgePending,
    },
  };
  return <SelectAmount navigation={navigation} route={newRoute} />;
}

export default WithdrawingAmount;
