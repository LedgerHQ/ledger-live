import { useMemo } from "react";
import { useRoute } from "@react-navigation/native";
import { useSelector } from "react-redux";
import { IconsLegacy } from "@ledgerhq/native-ui";
import { IconType } from "@ledgerhq/native-ui/components/Icon/type";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { useRampCatalog } from "@ledgerhq/live-common/platform/providers/RampCatalogProvider/useRampCatalog";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { NavigatorName, ScreenName } from "~/const";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { EntryOf } from "~/types/helpers";
import { accountsCountSelector, areAccountsEmptySelector } from "../reducers/accounts";
import { readOnlyModeEnabledSelector } from "../reducers/settings";

export type QuickAction = {
  disabled: boolean;
  route: EntryOf<BaseNavigatorStackParamList>;
  icon: IconType;
};

type Actions =
  | "SEND"
  | "RECEIVE"
  | "BUY"
  | "SELL"
  | "SWAP"
  | "STAKE"
  | "WALLET_CONNECT"
  | "RECOVER";

type Props = { currency?: CryptoOrTokenCurrency };

function useQuickActions({ currency }: Props = {}) {
  const route = useRoute();

  const { isCurrencyAvailable } = useRampCatalog();

  const readOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector);
  const accountsCount: number = useSelector(accountsCountSelector);
  const hasAccounts = accountsCount > 0;
  const areAccountsEmpty = useSelector(areAccountsEmptySelector);

  const recoverEntryPoint = useFeature("protectServicesMobile");
  const stakePrograms = useFeature("stakePrograms");

  const ptxServiceCtaExchangeDrawer = useFeature("ptxServiceCtaExchangeDrawer");
  const isPtxServiceCtaExchangeDrawerDisabled = !(ptxServiceCtaExchangeDrawer?.enabled ?? true);

  const canBeBought = !currency || isCurrencyAvailable(currency.id, "onRamp");
  const canBeSold = !currency || currency.id === "bitcoin";
  const canBeStaked =
    stakePrograms?.enabled && (!currency || stakePrograms?.params?.list.includes(currency?.id));
  const canBeRecovered = recoverEntryPoint?.enabled;

  const quickActionsList = useMemo(() => {
    const list: Partial<Record<Actions, QuickAction>> = {
      SEND: {
        disabled: !hasAccounts || readOnlyModeEnabled || areAccountsEmpty,
        route: [
          NavigatorName.SendFunds,
          {
            screen: ScreenName.SendCoin,
            params: { selectedCurrency: currency },
          },
        ],
        icon: IconsLegacy.ArrowTopMedium,
      },
      RECEIVE: {
        disabled: readOnlyModeEnabled,
        route: [
          NavigatorName.ReceiveFunds,
          currency
            ? {
                screen: ScreenName.ReceiveSelectAccount,
                params: { currency },
              }
            : { screen: ScreenName.ReceiveSelectCrypto },
        ],
        icon: IconsLegacy.ArrowBottomMedium,
      },
    };

    if (canBeBought) {
      list.BUY = {
        disabled: isPtxServiceCtaExchangeDrawerDisabled || readOnlyModeEnabled,
        route: [
          NavigatorName.Exchange,
          {
            screen: ScreenName.ExchangeBuy,
            params: { mode: "buy", defaultCurrencyId: currency?.id },
          },
        ],
        icon: IconsLegacy.PlusMedium,
      };
    }

    if (canBeSold) {
      list.SELL = {
        disabled:
          isPtxServiceCtaExchangeDrawerDisabled ||
          !hasAccounts ||
          readOnlyModeEnabled ||
          areAccountsEmpty,
        route: [
          NavigatorName.Exchange,
          {
            screen: ScreenName.ExchangeSell,
            params: { mode: "sell", defaultCurrencyId: currency?.id },
          },
        ],
        icon: IconsLegacy.MinusMedium,
      };
    }

    list.SWAP = {
      disabled:
        isPtxServiceCtaExchangeDrawerDisabled ||
        !hasAccounts ||
        readOnlyModeEnabled ||
        areAccountsEmpty,
      route: [
        NavigatorName.Swap,
        {
          screen: ScreenName.SwapTab,
          params: { currency },
        },
      ],
      icon: IconsLegacy.BuyCryptoMedium,
    };

    if (canBeStaked) {
      list.STAKE = {
        disabled: readOnlyModeEnabled,
        route: [
          NavigatorName.StakeFlow,
          {
            screen: ScreenName.Stake,
            params: {
              currencies: currency ? [currency.id] : undefined,
              parentRoute: route,
            },
          },
        ],
        icon: IconsLegacy.CoinsMedium,
      };
    }

    list.WALLET_CONNECT = {
      disabled: readOnlyModeEnabled,
      route: [
        NavigatorName.WalletConnect,
        {
          screen: ScreenName.WalletConnectConnect,
          params: {},
        },
      ],
      icon: IconsLegacy.WalletConnectMedium,
    };

    if (canBeRecovered) {
      list.RECOVER = {
        disabled: readOnlyModeEnabled,
        route: [
          NavigatorName.Main,
          {
            screen: NavigatorName.MyLedger,
            params: { screen: ScreenName.MyLedgerChooseDevice },
          },
        ],
        icon: IconsLegacy.ShieldCheckMedium,
      };
    }

    return list;
  }, [
    currency,
    hasAccounts,
    areAccountsEmpty,
    isPtxServiceCtaExchangeDrawerDisabled,
    readOnlyModeEnabled,
    route,
    canBeBought,
    canBeSold,
    canBeStaked,
    canBeRecovered,
  ]);

  return { quickActionsList };
}

export default useQuickActions;
