import { useMemo } from "react";
import { useRoute } from "@react-navigation/native";
import { useSelector } from "react-redux";
import { IconsLegacy } from "@ledgerhq/native-ui";
import { IconType } from "@ledgerhq/native-ui/components/Icon/type";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { useRampCatalog } from "@ledgerhq/live-common/platform/providers/RampCatalogProvider/useRampCatalog";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { AccountLike } from "@ledgerhq/types-live";
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

export type QuickActionProps = { currency?: CryptoOrTokenCurrency; accounts?: AccountLike[] };

function useQuickActions({ currency, accounts }: QuickActionProps = {}) {
  const route = useRoute();

  const { isCurrencyAvailable } = useRampCatalog();

  const readOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector);
  const hasAnyAccounts = useSelector(accountsCountSelector) > 0;
  const hasCurrencyAccounts = currency ? !!accounts?.length : hasAnyAccounts;
  const hasFunds = !useSelector(areAccountsEmptySelector) && hasAnyAccounts;
  const hasCurrency = currency ? !!accounts?.some(({ balance }) => balance.gt(0)) : hasFunds;

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
        disabled: readOnlyModeEnabled || !hasCurrency,
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
          !currency
            ? { screen: ScreenName.ReceiveSelectCrypto }
            : {
                screen: hasCurrencyAccounts
                  ? ScreenName.ReceiveSelectAccount
                  : ScreenName.ReceiveAddAccountSelectDevice,
                params: {
                  currency: currency.type === "TokenCurrency" ? currency.parentCurrency : currency,
                },
              },
        ],
        icon: IconsLegacy.ArrowBottomMedium,
      },
      SWAP: {
        disabled: isPtxServiceCtaExchangeDrawerDisabled || readOnlyModeEnabled || !hasFunds,
        route: [
          NavigatorName.Swap,
          {
            screen: ScreenName.SwapTab,
            params: { currency },
          },
        ],
        icon: IconsLegacy.BuyCryptoMedium,
      },
    };

    if (canBeBought) {
      list.BUY = {
        disabled: isPtxServiceCtaExchangeDrawerDisabled || readOnlyModeEnabled,
        route: [
          NavigatorName.Exchange,
          {
            screen: ScreenName.ExchangeBuy,
            params: { defaultCurrencyId: currency?.id },
          },
        ],
        icon: IconsLegacy.PlusMedium,
      };
    }

    if (canBeSold) {
      list.SELL = {
        disabled: isPtxServiceCtaExchangeDrawerDisabled || readOnlyModeEnabled || !hasCurrency,
        route: [
          NavigatorName.Exchange,
          {
            screen: ScreenName.ExchangeSell,
            params: { defaultCurrencyId: currency?.id },
          },
        ],
        icon: IconsLegacy.MinusMedium,
      };
    }

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
    hasCurrencyAccounts,
    hasCurrency,
    hasFunds,
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
