import React from "react";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { IconsLegacy } from "@ledgerhq/native-ui";
import { Trans } from "react-i18next";
import { isAccountEmpty, isTokenAccount } from "@ledgerhq/live-common/account/index";
import { ParamListBase, RouteProp } from "@react-navigation/native";
import { ActionButtonEvent, NavigationParamsType } from "~/components/FabActions";
import { NavigatorName, ScreenName } from "~/const";
import BigNumber from "bignumber.js";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { getStakeLabelLocaleBased } from "~/helpers/getStakeLabelLocaleBased";
import { WalletState } from "@ledgerhq/live-wallet/store";
import { StakingDrawerNavigationProps } from "~/components/Stake/types";
import { accountToWalletAPIAccount } from "@ledgerhq/live-common/wallet-api/converters";

const ethMagnitude = getCryptoCurrencyById("ethereum").units[0].magnitude ?? 18;

const ETH_LIMIT = BigNumber(32).times(BigNumber(10).pow(ethMagnitude));

type Props = {
  account: AccountLike;
  parentAccount: Account;
  parentRoute: RouteProp<ParamListBase, ScreenName>;
  walletState: WalletState;
};

type AccountTypeGetterProps = {
  isEthAccount: boolean;
  isPOLAccount: boolean;
  isBscAccount: boolean;
  isAvaxAccount: boolean;
  isStakekit: boolean;
};

const getAccountType = (account: AccountLike): AccountTypeGetterProps => {
  const isEthAccount = account.type === "Account" && account.currency.id === "ethereum";
  const isBscAccount = account.type === "Account" && account.currency.id === "bsc";
  const isAvaxAccount = account.type === "Account" && account.currency.id === "avalanche_c_chain";
  const isPOLAccount =
    account.type === "TokenAccount" &&
    account.token.id === "ethereum/erc20/polygon_ecosystem_token";

  const isStakekit = isBscAccount || isPOLAccount || isAvaxAccount;

  return { isEthAccount, isPOLAccount, isBscAccount, isAvaxAccount, isStakekit };
};

function getNavigatorParams({
  parentRoute,
  account,
  parentAccount,
  walletState,
}: Props): NavigationParamsType {
  const { isPOLAccount, isBscAccount, isAvaxAccount, isStakekit } = getAccountType(account);

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

  if (isStakekit) {
    const getYieldId = () => {
      if (isBscAccount) {
        return "bsc-bnb-native-staking";
      }
      if (isPOLAccount) {
        return "ethereum-matic-native-staking";
      }
      if (isAvaxAccount) {
        return "avalanche-avax-liquid-staking";
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

  const params: {
    screen: ScreenName;
    drawer: StakingDrawerNavigationProps;
    params: ParamListBase;
  } = {
    screen: parentRoute.name,
    drawer: {
      id: "EvmStakingDrawer",
      props: {
        singleProviderRedirectMode: true,
        accountId: account.id,
        walletApiAccountId: walletApiAccount.id,
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
    // since we have to go to different navigators
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
  const { isPOLAccount, isBscAccount, isAvaxAccount, isStakekit, isEthAccount } =
    getAccountType(account);

  if (isEthAccount || isStakekit) {
    const label = getStakeLabelLocaleBased();

    const navigationParams = getNavigatorParams({
      account,
      parentAccount,
      parentRoute,
      walletState,
    });

    const getCurrentCurrency = () => {
      if (isEthAccount) {
        return "ETH";
      }
      if (isBscAccount) {
        return "BNB";
      }

      if (isPOLAccount) {
        return "POL";
      }
      if (isAvaxAccount) {
        return "AVAX";
      }
    };
    return [
      {
        id: "stake",
        navigationParams,
        label: <Trans i18nKey={label} />,
        Icon: IconsLegacy.CoinsMedium,
        eventProperties: {
          currency:
            getCurrentCurrency() ??
            (isTokenAccount(account) ? account.token.ticker : account.currency.ticker),
        },
      },
    ];
  }

  return [];
};

export default {
  getMainActions,
};
