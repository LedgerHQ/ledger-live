import {
  hasMinimumDelegableBalance,
  randomizeProviders,
} from "@ledgerhq/live-common/families/elrond/helpers";
import type { ElrondAccount } from "@ledgerhq/live-common/families/elrond/types";
import { IconsLegacy } from "@ledgerhq/native-ui";
import React from "react";
import { Trans } from "react-i18next";

import type { Account } from "@ledgerhq/types-live";
import type { ActionButtonEvent, NavigationParamsType } from "~/components/FabActions";

import { getCurrentElrondPreloadData } from "@ledgerhq/coin-elrond/preload";
import { ParamListBase, RouteProp } from "@react-navigation/native";
import { NavigatorName, ScreenName } from "~/const";
import { getStakeLabelLocaleBased } from "~/helpers/getStakeLabelLocaleBased";

/*
 * Declare the types for the properties and return payload.
 */

export interface getActionsType {
  account: ElrondAccount;
  parentAccount?: Account;
  parentRoute: RouteProp<ParamListBase, ScreenName>;
}
export type getActionsReturnType = ActionButtonEvent[] | null | undefined;

/*
 * Declare the function that will return the actions' settings array.
 */

const getMainActions = ({
  account,
  parentAccount,
  parentRoute,
}: getActionsType): getActionsReturnType => {
  const delegationEnabled = hasMinimumDelegableBalance(account);
  const label = getStakeLabelLocaleBased();

  /*
   * Get a list of all the providers, randomize, and also the screen, conditionally, based on existing amount of delegations.
   */
  const preloaded = getCurrentElrondPreloadData();
  const validators = randomizeProviders(preloaded.validators);

  const isFirstTimeFlow =
    account.elrondResources && account.elrondResources.delegations.length === 0;
  const screen = isFirstTimeFlow
    ? ScreenName.ElrondDelegationStarted
    : ScreenName.ElrondDelegationValidator;

  /*
   * Return an empty array if "elrondResources" doesn't exist.
   */

  if (!account.elrondResources) {
    return [];
  }

  /*
   * Return the array of actions.
   */
  const navigationParams: NavigationParamsType = delegationEnabled
    ? [
        NavigatorName.ElrondDelegationFlow,
        {
          screen,
          params: {
            account,
            validators,
            source: parentRoute,
            skipStartedStep: !isFirstTimeFlow,
          },
        },
      ]
    : [
        NavigatorName.NoFundsFlow,
        {
          screen: ScreenName.NoFunds,
          params: {
            account,
            parentAccount,
          },
        },
      ];
  return [
    {
      id: "stake",
      label: <Trans i18nKey={label} />,
      Icon: IconsLegacy.CoinsMedium,
      navigationParams,
      eventProperties: {
        currency: "ELROND",
      },
    },
  ];
};

export default { getMainActions };
