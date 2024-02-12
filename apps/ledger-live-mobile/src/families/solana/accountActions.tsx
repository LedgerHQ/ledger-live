import React from "react";
import type { Account } from "@ledgerhq/types-live";
import { IconsLegacy } from "@ledgerhq/native-ui";
import { Trans } from "react-i18next";
import { ParamListBase, RouteProp } from "@react-navigation/native";
import { SolanaAccount } from "@ledgerhq/live-common/families/solana/types";
import { NavigatorName, ScreenName } from "~/const";
import type { ActionButtonEvent, NavigationParamsType } from "~/components/FabActions";

const getMainActions = ({
  account,
  parentAccount,
  parentRoute,
}: {
  account: SolanaAccount;
  parentAccount: Account;
  parentRoute: RouteProp<ParamListBase, ScreenName>;
}): ActionButtonEvent[] => {
  const delegationDisabled = account.solanaResources?.stakes.length > 1;

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
        NavigatorName.SolanaDelegationFlow,
        {
          screen: ScreenName.SolanaDelegationStarted,
          params: {
            accountId: account.id,
            parentId: parentAccount ? parentAccount.id : undefined,
            delegationAction: {
              kind: "new",
            },
            source: parentRoute,
          },
        },
      ];

  return [
    {
      id: "stake",
      navigationParams,
      label: <Trans i18nKey="account.stake" />,
      Icon: IconsLegacy.CoinsMedium,
      event: "button_clicked",
      eventProperties: {
        button: "stake",
        currency: "SOL",
        page: "Account Page",
      },
    },
  ];
};

export default {
  getMainActions,
};
