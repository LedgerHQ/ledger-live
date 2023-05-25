import React from "react";
import type { Account } from "@ledgerhq/types-live";
import { Icons } from "@ledgerhq/native-ui";
import { Trans } from "react-i18next";
import { isAccountEmpty } from "@ledgerhq/live-common/account/index";
import { NavigatorName, ScreenName } from "../../const";

const getMainActions = ({
  account,
  parentAccount,
  screen,
}: {
  account: Account;
  parentAccount: Account;
  screen: ScreenName;
}) => {
  if (account.type === "Account" && account.currency.id === "ethereum") {
    const navigationParams = isAccountEmpty(account)
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
          NavigatorName.Base,
          {
            screen,
            params: {
              drawer: {
                id: "EthStakingDrawer",
                props: {
                  singleProviderRedirectMode: true,
                  account,
                },
              },
            },
          },
        ];
    return [
      {
        id: "stake",
        navigationParams,
        label: <Trans i18nKey="account.stake" />,
        Icon: Icons.ClaimRewardsMedium,
        event: "button_clicked",
        eventProperties: {
          button: "stake",
          currency: "ETH",
          page: "Account Page",
        },
      },
    ];
  }
  return [];
};

export default {
  getMainActions,
};
