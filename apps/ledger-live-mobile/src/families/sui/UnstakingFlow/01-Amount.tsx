import invariant from "invariant";
import React from "react";
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
  const bridge = getAccountBridge(account, undefined);
  const mainAccount = getMainAccount(account, undefined);
  const { stakedSuiId, principal } = route.params.stakingPosition;
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
        mode: "undelegate",
        stakedSuiId,
      }),
    };
  });

  const transaction = bridgeTransaction as Transaction;
  const newRoute = {
    ...route,
    params: {
      ...route.params,
      transaction,
      max: new BigNumber(principal),
      value: transaction ? transaction.amount : new BigNumber(0),
      nextScreen: ScreenName.SuiUnstakingSelectDevice,
      updateTransaction,
      status,
      bridgePending,
    },
  };
  return <SelectAmount navigation={navigation} route={newRoute} />;
}

export default UnstakingAmount;
