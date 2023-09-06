import { useMemo } from "react";
import { useRoute } from "@react-navigation/native";
import { useSelector } from "react-redux";
import { type ParamListBase } from "@react-navigation/native";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { NavigatorName, ScreenName } from "../const";
import { accountsCountSelector, areAccountsEmptySelector } from "../reducers/accounts";
import { readOnlyModeEnabledSelector } from "../reducers/settings";

export type QuickAction = {
  disabled: boolean;
  route: [NavigatorName, { screen: ScreenName; params?: ParamListBase }];
};

export type QuickActionsList = {
  SEND: QuickAction;
  RECEIVE: QuickAction;
  BUY: QuickAction;
  SELL: QuickAction;
  SWAP: QuickAction;
  STAKE?: QuickAction;
  WALLET_CONNECT?: QuickAction;
};

function useQuickActions() {
  const route = useRoute();

  const readOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector);
  const accountsCount: number = useSelector(accountsCountSelector);
  const areAccountsEmpty = useSelector(areAccountsEmptySelector);

  const walletConnectEntryPoint = useFeature("walletConnectEntryPoint");
  const stakePrograms = useFeature("stakePrograms");

  const ptxServiceCtaExchangeDrawer = useFeature("ptxServiceCtaExchangeDrawer");

  const isPtxServiceCtaExchangeDrawerDisabled = useMemo(
    () => !(ptxServiceCtaExchangeDrawer?.enabled ?? true),
    [ptxServiceCtaExchangeDrawer],
  );

  const quickActionsList = useMemo(() => {
    const list: QuickActionsList = {
      SEND: {
        disabled: !accountsCount || readOnlyModeEnabled || areAccountsEmpty,
        route: [
          NavigatorName.SendFunds,
          {
            screen: ScreenName.SendCoin,
          },
        ],
      },
      RECEIVE: {
        disabled: readOnlyModeEnabled,
        route: [NavigatorName.ReceiveFunds, { screen: ScreenName.ReceiveSelectCrypto }],
      },
      BUY: {
        disabled: isPtxServiceCtaExchangeDrawerDisabled || readOnlyModeEnabled,
        route: [NavigatorName.Exchange, { screen: ScreenName.ExchangeBuy }],
      },
      SELL: {
        disabled:
          isPtxServiceCtaExchangeDrawerDisabled ||
          !accountsCount ||
          readOnlyModeEnabled ||
          areAccountsEmpty,
        route: [NavigatorName.Exchange, { screen: ScreenName.ExchangeSell }],
      },
      SWAP: {
        disabled:
          isPtxServiceCtaExchangeDrawerDisabled ||
          !accountsCount ||
          readOnlyModeEnabled ||
          areAccountsEmpty,
        route: [
          NavigatorName.Swap,
          {
            screen: ScreenName.SwapForm,
          },
        ],
      },
    };

    if (stakePrograms?.enabled) {
      list.STAKE = {
        disabled: readOnlyModeEnabled,
        route: [
          NavigatorName.StakeFlow,
          {
            screen: ScreenName.Stake,
            params: { parentRoute: route },
          },
        ],
      };
    }

    if (walletConnectEntryPoint?.enabled) {
      list.WALLET_CONNECT = {
        disabled: readOnlyModeEnabled,
        route: [
          NavigatorName.WalletConnect,
          {
            screen: ScreenName.WalletConnectConnect,
          },
        ],
      };
    }
    return list;
  }, [
    accountsCount,
    areAccountsEmpty,
    isPtxServiceCtaExchangeDrawerDisabled,
    readOnlyModeEnabled,
    route,
    stakePrograms?.enabled,
    walletConnectEntryPoint?.enabled,
  ]);

  return { quickActionsList };
}

export default useQuickActions;
