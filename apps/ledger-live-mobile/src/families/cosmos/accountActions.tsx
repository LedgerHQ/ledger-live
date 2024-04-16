import React from "react";
import { Trans } from "react-i18next";
import { ParamListBase, RouteProp } from "@react-navigation/native";

import { canDelegate } from "@ledgerhq/live-common/families/cosmos/logic";
import { IconsLegacy } from "@ledgerhq/native-ui";
import { CosmosAccount } from "@ledgerhq/live-common/families/cosmos/types";
import { Account } from "@ledgerhq/types-live";
import { NavigatorName, ScreenName } from "~/const";
import { ActionButtonEvent, NavigationParamsType } from "~/components/FabActions";

const getMainActions = ({
  account,
  parentAccount,
  parentRoute,
}: {
  account: CosmosAccount;
  parentAccount?: Account;
  parentRoute: RouteProp<ParamListBase, ScreenName>;
}): ActionButtonEvent[] => {
  const delegationDisabled = !canDelegate(account);
  const startWithValidator =
    account.cosmosResources && account.cosmosResources?.delegations.length > 0;
  const navigationParams: NavigationParamsType = delegationDisabled
    ? [
        NavigatorName.NoFundsFlow,
        {
          screen: ScreenName.NoFunds,
          params: {
            account,
            parentAccount,
          },
        },
      ]
    : [
        NavigatorName.CosmosDelegationFlow,
        {
          screen: startWithValidator
            ? ScreenName.CosmosDelegationValidator
            : ScreenName.CosmosDelegationStarted,
          params: {
            source: parentRoute,
            skipStartedStep: startWithValidator,
          },
        },
      ];

  return [
    {
      id: "stake",
      navigationParams,
      label: <Trans i18nKey="account.stake" />,
      Icon: IconsLegacy.CoinsMedium,
      eventProperties: {
        currency: "COSMOS",
      },
    },
  ];
};

export default {
  getMainActions,
};
