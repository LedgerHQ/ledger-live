import invariant from "invariant";
import React, { useEffect, useRef } from "react";
import { BigNumber } from "bignumber.js";
import type { Transaction } from "@ledgerhq/live-common/families/sui/types";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import SelectAmount from "../shared/02-SelectAmount";
import { ScreenName } from "~/const";
import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { SuiUnstakingFlowParamList } from "./types";
import { useAccountScreen } from "LLM/hooks/useAccountScreen";

type Props = BaseComposite<
  StackNavigatorProps<SuiUnstakingFlowParamList, ScreenName.SuiUnstakingAmount>
>;

function UnstakingAmount({ navigation, route }: Props) {
  const { account } = useAccountScreen(route);
  invariant(account, "account required");
  const mainAccount = getMainAccount(account, undefined);
  const { stakedSuiId, principal } = route.params.stakingPosition;
  const {
    transaction: bridgeTransaction,
    setTransaction,
    updateTransaction,
    status,
    bridgePending,
  } = useBridgeTransaction(() => ({
    account,
  }));

  const suiUnstakeInitSet = useRef(false);
  useEffect(() => {
    if (bridgeTransaction && !suiUnstakeInitSet.current) {
      suiUnstakeInitSet.current = true;
      getAccountBridge(account, undefined).then(bridge => {
        const t = bridge.createTransaction(mainAccount);
        setTransaction(
          bridge.updateTransaction(t, {
            mode: "undelegate",
            stakedSuiId,
          }) as typeof bridgeTransaction,
        );
      });
    }
  }, [bridgeTransaction, setTransaction, account, mainAccount, stakedSuiId]);

  const transaction = bridgeTransaction as Transaction;
  const newRoute = {
    ...route,
    params: {
      ...route.params,
      transaction,
      max: new BigNumber(principal),
      value: transaction ? transaction.amount : new BigNumber(0),
      nextScreen: ScreenName.SuiUnstakingSelectDevice,
      updateTransaction: updateTransaction as unknown as (
        updater: (arg0: Transaction) => Transaction,
      ) => void,
      status,
      bridgePending,
    },
  };
  return <SelectAmount navigation={navigation} route={newRoute} />;
}

export default UnstakingAmount;
