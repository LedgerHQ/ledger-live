import React from "react";
import { Trans } from "react-i18next";
import { ParamListBase, RouteProp } from "@react-navigation/native";

import { canDelegate } from "@ledgerhq/live-common/families/cosmos/logic";
import { IconsLegacy } from "@ledgerhq/native-ui";
import { CosmosAccount } from "@ledgerhq/live-common/families/cosmos/types";
import { Account } from "@ledgerhq/types-live";

import { NavigatorName, ScreenName } from "../../const";
import { ActionButtonEvent } from "../../components/FabActions";

type NavigationParamsType = readonly [name: string, options: object];

const getMainActions = ({
  account,
  parentAccount,
  parentRoute,
}: {
  account: CosmosAccount;
  parentAccount?: Account;
  parentRoute: RouteProp<ParamListBase, ScreenName>;
}): ActionButtonEvent[] | null | undefined => {
  const delegationDisabled = !canDelegate(account);
  const navigationParams = delegationDisabled
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
          screen:
            account.cosmosResources && account.cosmosResources?.delegations.length > 0
              ? ScreenName.CosmosDelegationValidator
              : ScreenName.CosmosDelegationStarted,
          params: {
            source: parentRoute,
          },
        },
      ];
  return [
    {
      id: "stake",
      navigationParams: navigationParams as unknown as NavigationParamsType,
      label: <Trans i18nKey="account.stake" />,
      Icon: IconsLegacy.CoinsMedium,
      event: "button_clicked",
      eventProperties: {
        button: "stake",
        currency: "COSMOS",
        page: "Account Page",
      },
    },
  ];
};

export default {
  getMainActions,
};
