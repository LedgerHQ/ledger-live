// @flow
import invariant from "invariant";
import React from "react";
import { useSelector } from "react-redux";
import { BigNumber } from "bignumber.js";

import type { CosmosMappedDelegation } from "@ledgerhq/live-common/lib/families/cosmos/types";

import { getAccountBridge } from "@ledgerhq/live-common/lib/bridge";
import { getMainAccount } from "@ledgerhq/live-common/lib/account";
import useBridgeTransaction from "@ledgerhq/live-common/lib/bridge/useBridgeTransaction";

import { accountScreenSelector } from "../../../reducers/accounts";

import SelectAmount from "../shared/02-SelectAmount";
import { ScreenName } from "../../../const";

type RouteParams = {
  accountId: string,
  delegation: CosmosMappedDelegation,
};

type Props = {
  navigation: any,
  route: { params: RouteParams },
};

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
      transaction,
      validator,
      max: amount,
      undelegatedBalance: amount,
      mode: "undelegation",
      nextScreen: ScreenName.CosmosUndelegationSelectDevice,
    },
  };

  // $FlowFixMe
  return <SelectAmount navigation={navigation} route={newRoute} />;
}

export default UndelegationAmount;
