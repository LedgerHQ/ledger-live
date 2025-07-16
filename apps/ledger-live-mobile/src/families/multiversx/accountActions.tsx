import {
  hasMinimumDelegableBalance,
  randomizeProviders,
} from "@ledgerhq/live-common/families/multiversx/helpers";
import type { MultiversXAccount } from "@ledgerhq/live-common/families/multiversx/types";
import { IconsLegacy } from "@ledgerhq/native-ui";
import React from "react";
import { Trans } from "react-i18next";

import type { Account } from "@ledgerhq/types-live";
import type { ActionButtonEvent, NavigationParamsType } from "~/components/FabActions";

import { getCurrentMultiversXPreloadData } from "@ledgerhq/coin-multiversx/preload";
import { ParamListBase, RouteProp } from "@react-navigation/native";
import { NavigatorName, ScreenName } from "~/const";
import { getStakeLabelLocaleBased } from "~/helpers/getStakeLabelLocaleBased";

/*
 * Declare the types for the properties and return payload.
 */

export interface getActionsType {
  account: MultiversXAccount;
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
  const preloaded = getCurrentMultiversXPreloadData();
  const validators = randomizeProviders(preloaded.validators);

  const isFirstTimeFlow =
    account.multiversxResources && account.multiversxResources.delegations.length === 0;
  const screen = isFirstTimeFlow
    ? ScreenName.MultiversXDelegationStarted
    : ScreenName.MultiversXDelegationValidator;

  /*
   * Return an empty array if "multiversxResources" doesn't exist.
   */

  if (!account.multiversxResources) {
    return [];
  }

  /*
   * Return the array of actions.
   */
  const navigationParams: NavigationParamsType = delegationEnabled
    ? [
        NavigatorName.MultiversXDelegationFlow,
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
        currency: "MULTIVERSX",
      },
    },
  ];
};

export default { getMainActions };
