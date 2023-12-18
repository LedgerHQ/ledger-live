import React from "react";
import type { ElrondAccount } from "@ledgerhq/live-common/families/elrond/types";
import { getCurrentElrondPreloadData } from "@ledgerhq/live-common/families/elrond/preload";
import { randomizeProviders } from "@ledgerhq/live-common/families/elrond/helpers/randomizeProviders";
import { hasMinimumDelegableBalance } from "@ledgerhq/live-common/families/elrond/helpers/hasMinimumDelegableBalance";
import { IconsLegacy } from "@ledgerhq/native-ui";
import { Trans } from "react-i18next";

import type { Account } from "@ledgerhq/types-live";
import type { ActionButtonEvent, NavigationParamsType } from "~/components/FabActions";

import { NavigatorName, ScreenName } from "~/const";
import { ParamListBase, RouteProp } from "@react-navigation/native";

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

  /*
   * Get a list of all the providers, randomize, and also the screen, conditionally, based on existing amount of delegations.
   */
  const preloaded = getCurrentElrondPreloadData();
  const validators = randomizeProviders(preloaded.validators);

  const screen =
    account.elrondResources && account.elrondResources.delegations.length === 0
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
        { screen, params: { account, validators, source: parentRoute } },
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
      label: <Trans i18nKey="account.stake" />,
      Icon: IconsLegacy.CoinsMedium,
      navigationParams,
      event: "button_clicked",
      eventProperties: {
        button: "stake",
        currency: "ELROND",
        page: "Account Page",
      },
    },
  ];
};

export default { getMainActions };
