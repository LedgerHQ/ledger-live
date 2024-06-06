import React from "react";
import type { Account, TokenAccount } from "@ledgerhq/types-live";
import { IconsLegacy } from "@ledgerhq/native-ui";
import { Trans } from "react-i18next";
import { isAccountEmpty } from "@ledgerhq/live-common/account/index";
import { ParamListBase, RouteProp } from "@react-navigation/native";
import { ActionButtonEvent, NavigationParamsType } from "~/components/FabActions";
import { NavigatorName, ScreenName } from "~/const";
import BigNumber from "bignumber.js";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";

const ethMagnitude = getCryptoCurrencyById("ethereum").units[0].magnitude ?? 18;

const ETH_LIMIT = BigNumber(32).times(BigNumber(10).pow(ethMagnitude));

type Props = {
  account: Account | TokenAccount;
  parentAccount: Account;
  parentRoute: RouteProp<ParamListBase, ScreenName>;
};

function getNavigatorParams(
  { parentRoute, account, parentAccount }: Props,
  {
    isAvalancheCAccount,
    isEthereumMaticTokenAccount,
    isArbitrumGRTTokenAccount,
  }: {
    isEthereumMaticTokenAccount: boolean;
    isAvalancheCAccount: boolean;
    isArbitrumGRTTokenAccount: boolean;
  },
): NavigationParamsType {
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

  if (isEthereumMaticTokenAccount || isAvalancheCAccount || isArbitrumGRTTokenAccount) {
    const yieldId = (() => {
      if (isEthereumMaticTokenAccount) {
        return "ethereum-matic-native-staking";
      } else if (isAvalancheCAccount) {
        return "avalanche-avax-liquid-staking";
      }
      return "arbitrum-grt-native-staking";
    })();

    return [
      ScreenName.PlatformApp,
      {
        params: {
          platform: "stakekit",
          name: "StakeKit",
          accountId: account.id,
          yieldId,
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
        has32Eth: account.spendableBalance.gt(ETH_LIMIT),
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
  const isEthereumAccount = account.type === "Account" && account.currency.id === "ethereum";
  const isEthereumMaticTokenAccount =
    account.type === "TokenAccount" && account.token.id === "ethereum/erc20/matic";
  const isAvalancheCAccount =
    account.type === "Account" && account.currency.id === "avalanche_c_chain";
  const isArbitrumGRTTokenAccount =
    account.type === "TokenAccount" && account.token.id === "arbitrum/erc20/graph_token";

  const canStake =
    isEthereumAccount ||
    isEthereumMaticTokenAccount ||
    isAvalancheCAccount ||
    isArbitrumGRTTokenAccount;

  if (canStake) {
    const navigationParams = getNavigatorParams(
      {
        account,
        parentAccount,
        parentRoute,
      },
      { isEthereumMaticTokenAccount, isAvalancheCAccount, isArbitrumGRTTokenAccount },
    );

    return [
      {
        id: "stake",
        navigationParams,
        label: <Trans i18nKey="account.stake" />,
        Icon: IconsLegacy.CoinsMedium,
        eventProperties: {
          currency:
            account.type === "TokenAccount" ? account?.token?.name : account?.currency?.name,
        },
      },
    ];
  }

  return [];
};

export default {
  getMainActions,
};
