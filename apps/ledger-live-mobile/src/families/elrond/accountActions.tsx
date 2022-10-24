import React from "react";
import { BigNumber } from "bignumber.js";
import { ElrondAccount } from "@ledgerhq/live-common/families/elrond/types";
import { Icons } from "@ledgerhq/native-ui";
import { Trans } from "react-i18next";

import { NavigatorName, ScreenName } from "../../const";
import { ActionButtonEvent } from "../../components/FabActions";

import { denominate } from "./helpers";

export interface getActionsType {
  account: ElrondAccount;
}
export type getActionsReturnType = ActionButtonEvent[] | null | undefined;

const getActions = (props: getActionsType): getActionsReturnType => {
  const { account } = props;

  const balance = denominate({ input: String(account.spendableBalance) });
  const delegationEnabled = new BigNumber(balance).gt(1);

  return [
    {
      id: "stake",
      disabled: !delegationEnabled,
      label: <Trans i18nKey="account.stake" />,
      Icon: Icons.ClaimRewardsMedium,
      navigationParams: [
        NavigatorName.ElrondDelegationFlow,
        { screen: ScreenName.ElrondDelegationStarted },
      ],
    },
  ];
};

export default {
  getActions,
};
