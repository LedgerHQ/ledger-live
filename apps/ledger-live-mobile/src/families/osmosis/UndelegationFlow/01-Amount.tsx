import invariant from "invariant";
import React from "react";
import { useSelector } from "react-redux";
import { BigNumber } from "bignumber.js";
import type { Transaction as OsmosisTransaction } from "@ledgerhq/live-common/families/osmosis/types";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { CosmosValidatorItem } from "@ledgerhq/live-common/families/cosmos/types";
import { accountScreenSelector } from "../../../reducers/accounts";
import SelectAmount from "../../cosmos/shared/02-SelectAmount";
import { ScreenName } from "../../../const";
import type { StackNavigatorProps } from "../../../components/RootNavigator/types/helpers";
import type { OsmosisUndelegationFlowParamList } from "./types";

type Props = StackNavigatorProps<
  OsmosisUndelegationFlowParamList,
  ScreenName.OsmosisUndelegationAmount
>;

function UndelegationAmount({ navigation, route }: Props) {
  const { account } = useSelector(accountScreenSelector(route));

  invariant(account, "account required");

  const bridge = getAccountBridge(account, undefined);
  const mainAccount = getMainAccount(account, undefined);

  const validator = route.params.delegation.validator;
  const amount = route.params.delegation.amount;

  const { transaction } = useBridgeTransaction(() => {
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
      transaction: transaction as OsmosisTransaction,
      validator: validator as CosmosValidatorItem,
      max: amount,
      undelegatedBalance: amount,
      mode: "undelegation",
      nextScreen: ScreenName.OsmosisUndelegationSelectDevice,
    },
  } as Props["route"];

  return <SelectAmount navigation={navigation} route={newRoute} />;
}

export default UndelegationAmount;
