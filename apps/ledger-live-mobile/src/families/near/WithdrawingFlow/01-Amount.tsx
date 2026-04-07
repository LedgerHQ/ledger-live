import invariant from "invariant";
import React, { useEffect, useRef } from "react";
import { BigNumber } from "bignumber.js";
import type { Transaction, NearAccount } from "@ledgerhq/live-common/families/near/types";
import { getMaxAmount } from "@ledgerhq/live-common/families/near/logic";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import SelectAmount from "../shared/02-SelectAmount";
import { ScreenName } from "~/const";
import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { NearWithdrawingFlowParamList } from "./types";
import { useAccountScreen } from "LLM/hooks/useAccountScreen";

type Props = BaseComposite<
  StackNavigatorProps<NearWithdrawingFlowParamList, ScreenName.NearWithdrawingAmount>
>;

function WithdrawingAmount({ navigation, route }: Props) {
  const { account } = useAccountScreen(route);
  invariant(account, "account required");
  const mainAccount = getMainAccount(account, undefined);
  const { validatorId } = route.params.stakingPosition;
  const {
    transaction: bridgeTransaction,
    setTransaction,
    updateTransaction,
    status,
    bridgePending,
  } = useBridgeTransaction(() => ({
    account,
  }));

  const withdrawInitSet = useRef(false);
  useEffect(() => {
    if (bridgeTransaction && !withdrawInitSet.current) {
      withdrawInitSet.current = true;
      setTransaction({
        ...bridgeTransaction,
        mode: "withdraw",
        recipient: validatorId || "",
      } as typeof bridgeTransaction);
    }
  }, [bridgeTransaction, setTransaction, validatorId]);
  const transaction = bridgeTransaction as Transaction;
  const newRoute = {
    ...route,
    params: {
      ...route.params,
      transaction,
      max: getMaxAmount(account as NearAccount, transaction, transaction?.fees),
      value: transaction ? transaction.amount : new BigNumber(0),
      nextScreen: ScreenName.NearWithdrawingSelectDevice,
      updateTransaction: updateTransaction as unknown as (
        updater: (arg0: Transaction) => Transaction,
      ) => void,
      status,
      bridgePending,
    },
  };
  return <SelectAmount navigation={navigation} route={newRoute} />;
}

export default WithdrawingAmount;
