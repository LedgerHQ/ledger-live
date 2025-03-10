import React from "react";
import type { Account } from "@ledgerhq/types-live";
import { IconsLegacy } from "@ledgerhq/native-ui";
import { Trans } from "react-i18next";
import { isAccountEmpty } from "@ledgerhq/live-common/account/index";
import { ParamListBase, RouteProp } from "@react-navigation/native";
import { ActionButtonEvent, NavigationParamsType } from "~/components/FabActions";
import { NavigatorName, ScreenName } from "~/const";
import BigNumber from "bignumber.js";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { getStakeLabelLocaleBased } from "~/helpers/getStakeLabelLocaleBased";
import { accountToWalletAPIAccount } from "@ledgerhq/live-common/wallet-api/converters";
import { WalletState } from "@ledgerhq/live-wallet/store";

const ethMagnitude = getCryptoCurrencyById("ethereum").units[0].magnitude ?? 18;

const ETH_LIMIT = BigNumber(32).times(BigNumber(10).pow(ethMagnitude));

type Props = {
  account: Account;
  parentAccount: Account;
  parentRoute: RouteProp<ParamListBase, ScreenName>;
  walletState: WalletState;
};

function getNavigatorParams({
  parentRoute,
  account,
  parentAccount,
  walletState,
}: Props): NavigationParamsType {
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

  if (
    account.type === "Account" &&
    (account.currency.id === "bsc" || account.currency.id === "polygon")
  ) {
    const getYieldId = () => {
      if (account.currency.id === "bsc") {
        return "bsc-bnb-native-staking";
      }
      if (account.currency.id === "polygon") {
        return "ethereum-matic-native-staking";
      }
    };

    return [
      ScreenName.PlatformApp,
      {
        params: {
          platform: "stakekit",
          name: "StakeKit",
          accountId: account.id,
          yieldId: getYieldId(),
        },
      },
    ];
  }

  const walletApiAccount = accountToWalletAPIAccount(walletState, account, parentAccount);

  const params = {
    screen: parentRoute.name,
    drawer: {
      id: "EvmStakingDrawer",
      props: {
        singleProviderRedirectMode: true,
        accountId: walletApiAccount.id,
        has32Eth: account.spendableBalance.gt(ETH_LIMIT),
      },
    },
    params: {
      ...(parentRoute.params ?? {}),
      account: walletApiAccount,
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

const getMainActions = ({
  account,
  parentAccount,
  parentRoute,
  walletState,
}: Props): ActionButtonEvent[] => {
  if (
    account.type === "Account" &&
    (account.currency.id === "ethereum" ||
      account.currency.id === "bsc" ||
      account.currency.id === "polygon")
  ) {
    const label = getStakeLabelLocaleBased();

    const navigationParams = getNavigatorParams({
      account,
      parentAccount,
      parentRoute,
      walletState,
    });
    const getCurrentCurrency = () => {
      if (account.currency.id === "ethereum") {
        return "ETH";
      }
      if (account.currency.id === "bsc") {
        return "BNB";
      }

      if (account.currency.id === "polygon") {
        return "POL";
      }
    };

    return [
      {
        id: "stake",
        navigationParams,
        label: <Trans i18nKey={label} />,
        Icon: IconsLegacy.CoinsMedium,
        eventProperties: {
          currency: getCurrentCurrency(),
        },
      },
    ];
  }

  return [];
};

export default {
  getMainActions,
};
