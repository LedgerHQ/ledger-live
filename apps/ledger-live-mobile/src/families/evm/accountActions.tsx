import React from "react";
import type { Account } from "@ledgerhq/types-live";
import { IconsLegacy } from "@ledgerhq/native-ui";
import { Trans } from "react-i18next";
import { isAccountEmpty } from "@ledgerhq/live-common/account/index";
import { ParamListBase, RouteProp } from "@react-navigation/native";
import { ActionButtonEvent, NavigationParamsType } from "~/components/FabActions";
import { NavigatorName, ScreenName } from "~/const";

type Props = {
  account: Account;
  parentAccount: Account;
  parentRoute: RouteProp<ParamListBase, ScreenName>;
};

function getNavigatorParams({ parentRoute, account, parentAccount }: Props): NavigationParamsType {
  if (isAccountEmpty(account)) {
    return [
      NavigatorName.NoFundsFlow,
      {
        screen: ScreenName.NoFunds,
        params: {
          account,
          parentAccount,
        },
      },
    ];
  }

  const params = {
    screen: parentRoute.name,
    drawer: {
      id: "EvmStakingDrawer",
      props: {
        singleProviderRedirectMode: true,
        accountId: account.id,
      },
    },
    params: {
      ...(parentRoute.params ?? {}),
      account,
      parentAccount,
    },
  };

  switch (parentRoute.name) {
    // since we have to go to different navigators b
    case ScreenName.Account:
    case ScreenName.Asset:
      return [NavigatorName.Accounts, params];
    case ScreenName.MarketDetail:
      return [NavigatorName.Market, params];
    default:
      return [NavigatorName.Base, params];
  }
}

const getMainActions = ({ account, parentAccount, parentRoute }: Props): ActionButtonEvent[] => {
  if (account.type === "Account" && account.currency.id === "ethereum") {
    const navigationParams = getNavigatorParams({
      account,
      parentAccount,
      parentRoute,
    });

    return [
      {
        id: "stake",
        navigationParams,
        label: <Trans i18nKey="account.stake" />,
        Icon: IconsLegacy.CoinsMedium,
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
