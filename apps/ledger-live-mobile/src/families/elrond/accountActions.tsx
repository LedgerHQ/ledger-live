import React from "react";
import { BigNumber } from "bignumber.js";
import { ElrondAccount } from "@ledgerhq/live-common/families/elrond/types";
import { Icons } from "@ledgerhq/native-ui";
import { Trans } from "react-i18next";

import { NavigatorName, ScreenName } from "../../const";
import { ActionButtonEvent } from "../../components/FabActions";

import { denominate } from "./helpers/denominate";
import { randomizeProviders } from "./helpers/randomizeProviders";

/*
 * Declare the types for the properties and return payload.
 */

export interface getActionsType {
  account: ElrondAccount;
}
export type getActionsReturnType = ActionButtonEvent[] | null | undefined;

/*
 * Declare the function that will return the actions' settings array.
 */

const getActions = (props: getActionsType): getActionsReturnType => {
  const { account } = props;

  const balance = denominate({ input: String(account.spendableBalance) });
  const delegationEnabled = new BigNumber(balance).gt(1);

  /*
   * Get a list of all the providers, randomize, and also the screen, conditionally, based on existing amount of delegations.
   */

  const validators = randomizeProviders(account.elrondResources.providers);
  const screen =
    account.elrondResources.delegations.length === 0
      ? ScreenName.ElrondDelegationStarted
      : ScreenName.ElrondDelegationValidator;

  /*
   * Return the array of actions.
   */

  return [
    {
      id: "stake",
      disabled: !delegationEnabled,
      label: <Trans i18nKey="account.stake" />,
      Icon: Icons.ClaimRewardsMedium,
      navigationParams: [
        NavigatorName.ElrondDelegationFlow,
        { screen, params: { account, validators } },
      ],
    },
  ];
};

export default {
  getActions,
};
