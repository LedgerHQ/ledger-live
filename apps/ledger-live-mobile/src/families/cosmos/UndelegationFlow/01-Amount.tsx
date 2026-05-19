import invariant from "invariant";
import React from "react";
import { BigNumber } from "bignumber.js";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import { Transaction } from "@ledgerhq/live-common/generated/types";
import type { Transaction as CosmosTransaction } from "@ledgerhq/live-common/families/cosmos/types";
import SelectAmount from "../shared/02-SelectAmount";
import { ScreenName } from "~/const";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { CosmosUndelegationFlowParamList } from "./types";
import { useAccountScreen } from "LLM/hooks/useAccountScreen";

type Props = StackNavigatorProps<
  CosmosUndelegationFlowParamList,
  ScreenName.CosmosUndelegationAmount
>;

function UndelegationAmount({ navigation, route }: Props) {
  const { account } = useAccountScreen(route);
  invariant(account, "account required");
  const mainAccount = getMainAccount(account, undefined);
  const validator = route.params.delegation.validator;
  const amount = route.params.delegation.amount;
  const bridge = useAccountBridge<CosmosTransaction>(account, undefined);
  const { transaction } = useBridgeTransaction(bridge, () => {
    const t = bridge.createTransaction(mainAccount);
    return {
      account,
      transaction: bridge.updateTransaction(t, {
        mode: "undelegate",
        validators: [
          {
            address: validator ? validator.validatorAddress : "",
            amount: BigNumber(0),
          },
        ],
        recipient: mainAccount.freshAddress,
      }),
    };
  });
  const newRoute = {
    ...route,
    params: {
      ...route.params,
      transaction: transaction as Transaction,
      validator,
      max: amount,
      undelegatedBalance: amount,
      mode: "undelegation",
      nextScreen: ScreenName.CosmosUndelegationBridgeTransaction,
    },
  } as Props["route"];
  return <SelectAmount navigation={navigation} route={newRoute} />;
}

export default UndelegationAmount;
