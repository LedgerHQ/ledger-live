// @flow
import React from "react";

import { BigNumber } from "bignumber.js";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";

import SelectAmount from "../../../shared/02-SelectAmount";
import { ScreenName } from "../../../../../const";

const Amount = (props: any) => {
  const { navigation, route } = props;

  const account = route.params.account;
  const validator = route.params.contract;
  const amount = route.params.amount;

  const bridge = getAccountBridge(account);
  const mainAccount = getMainAccount(account, undefined);

  const { transaction } = useBridgeTransaction(() => ({
    account,
    transaction: bridge.updateTransaction(
      bridge.createTransaction(mainAccount),
      {
        mode: "unDelegate",
        amount: BigNumber(0),
        recipient: validator,
      },
    ),
  }));

  const newRoute = {
    ...route,
    params: {
      ...route.params,
      transaction,
      validator,
      max: amount,
      mode: "undelegation",
      nextScreen: ScreenName.ElrondUndelegationSelectDevice,
    },
  };

  return <SelectAmount navigation={navigation} route={newRoute} />;
};

export default Amount;
