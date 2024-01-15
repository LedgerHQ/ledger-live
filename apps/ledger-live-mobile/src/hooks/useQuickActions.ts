import { useMemo } from "react";
import { useRoute } from "@react-navigation/native";
import { useSelector } from "react-redux";
import { IconsLegacy } from "@ledgerhq/native-ui";
import { type ParamListBase } from "@react-navigation/native";
import { IconType } from "@ledgerhq/native-ui/components/Icon/type";
import useFeature from "@ledgerhq/live-config/featureFlags/useFeature";
import { NavigatorName, ScreenName } from "~/const";
import { accountsCountSelector, areAccountsEmptySelector } from "../reducers/accounts";
import { readOnlyModeEnabledSelector } from "../reducers/settings";

export type QuickAction = {
  disabled: boolean;
  route: [NavigatorName, { screen: ScreenName; params?: ParamListBase }];
  icon: IconType;
};

export type QuickActionsList = {
  SEND: QuickAction;
  RECEIVE: QuickAction;
  BUY: QuickAction;
  SELL: QuickAction;
  SWAP: QuickAction;
  STAKE?: QuickAction;
  WALLET_CONNECT?: QuickAction;
  RECOVER?: QuickAction;
};

function useQuickActions() {
  const route = useRoute();

  const readOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector);
  const accountsCount: number = useSelector(accountsCountSelector);
  const areAccountsEmpty = useSelector(areAccountsEmptySelector);

  const walletConnectEntryPoint = useFeature("walletConnectEntryPoint");
  const recoverEntryPoint = useFeature("protectServicesMobile");
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
        icon: IconsLegacy.ArrowTopMedium,
      },
      RECEIVE: {
        disabled: readOnlyModeEnabled,
        route: [NavigatorName.ReceiveFunds, { screen: ScreenName.ReceiveSelectCrypto }],
        icon: IconsLegacy.ArrowBottomMedium,
      },
      BUY: {
        disabled: isPtxServiceCtaExchangeDrawerDisabled || readOnlyModeEnabled,
        route: [NavigatorName.Exchange, { screen: ScreenName.ExchangeBuy }],
        icon: IconsLegacy.PlusMedium,
      },
      SELL: {
        disabled:
          isPtxServiceCtaExchangeDrawerDisabled ||
          !accountsCount ||
          readOnlyModeEnabled ||
          areAccountsEmpty,
        route: [NavigatorName.Exchange, { screen: ScreenName.ExchangeSell }],
        icon: IconsLegacy.MinusMedium,
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
        icon: IconsLegacy.BuyCryptoMedium,
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
        icon: IconsLegacy.CoinsMedium,
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
        icon: IconsLegacy.WalletConnectMedium,
      };
    }

    if (recoverEntryPoint?.enabled) {
      list.RECOVER = {
        disabled: readOnlyModeEnabled,
        route: [
          NavigatorName.Base,
          {
            screen: ScreenName.Manager,
          },
        ],
        icon: IconsLegacy.ShieldCheckMedium,
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
    recoverEntryPoint?.enabled,
  ]);

  return { quickActionsList };
}

export default useQuickActions;
