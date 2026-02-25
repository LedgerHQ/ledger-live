import { useMemo } from "react";
import { useRoute } from "@react-navigation/native";
import { useSelector } from "~/context/hooks";
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
import { useStake } from "LLM/hooks/useStake/useStake";
import { walletSelector } from "~/reducers/wallet";
import { getAccountCurrency, getParentAccount } from "@ledgerhq/coin-framework/lib/account/helpers";
import { shallowAccountsSelector } from "~/reducers/accounts";
import { useOpenStakeDrawer } from "LLM/features/Stake";
import { useOpenReceiveDrawer } from "LLM/features/Receive";
import { useOpenSwap } from "LLM/features/Swap";

export type QuickAction = {
  disabled: boolean;
  route?: EntryOf<BaseNavigatorStackParamList>;
  customHandler?: () => void;
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
  const hasFunds = !useSelector(areAccountsEmptySelector) && hasAnyAccounts;
  const hasCurrency = currency ? !!accounts?.some(({ balance }) => balance.gt(0)) : hasFunds;

  const recoverEntryPoint = useFeature("protectServicesMobile");

  const ptxServiceCtaExchangeDrawer = useFeature("ptxServiceCtaExchangeDrawer");
  const isPtxServiceCtaExchangeDrawerDisabled = !(ptxServiceCtaExchangeDrawer?.enabled ?? true);

  const canBeBought = !currency || isCurrencyAvailable(currency.id, "onRamp");
  const canBeSold = !currency || currency.id === "bitcoin";

  const {
    getCanStakeUsingLedgerLive,
    getCanStakeUsingPlatformApp,
    getRouteParamsForPlatformApp,
    enabledCurrencies,
    partnerSupportedAssets,
  } = useStake();
  const canStakeCurrencyUsingLedgerLive = !currency
    ? false
    : getCanStakeUsingLedgerLive(currency?.id);
  const stakeAccount = accounts?.[0];

  const shallowAccounts = useSelector(shallowAccountsSelector);
  const parentAccount = stakeAccount ? getParentAccount(stakeAccount, shallowAccounts) : undefined;

  const stakeAccountCurrency = !stakeAccount ? null : getAccountCurrency(stakeAccount);
  const walletState = useSelector(walletSelector);
  const partnerStakeRoute =
    !stakeAccount || !stakeAccountCurrency || !getCanStakeUsingPlatformApp(stakeAccountCurrency?.id)
      ? null
      : getRouteParamsForPlatformApp(stakeAccount, walletState, parentAccount);

  const canBeRecovered = recoverEntryPoint?.enabled;

  const whitelistedCurrencies = useMemo(
    () => Array.from(new Set([...enabledCurrencies, ...partnerSupportedAssets])),
    [enabledCurrencies, partnerSupportedAssets],
  );

  const stakeDrawerCurrencies = useMemo(() => {
    if (currency) {
      return [currency.id];
    }
    if (whitelistedCurrencies.length > 0) {
      return whitelistedCurrencies;
    }
    return undefined;
  }, [currency, whitelistedCurrencies]);

  const { handleOpenStakeDrawer } = useOpenStakeDrawer({
    currencies: stakeDrawerCurrencies,
    sourceScreenName: route.name,
  });

  const { handleOpenReceiveDrawer } = useOpenReceiveDrawer({
    currency,
    sourceScreenName: route.name,
  });

  const { handleOpenSwap } = useOpenSwap({ currency, sourceScreenName: route.name });

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
        customHandler: handleOpenReceiveDrawer,
        icon: IconsLegacy.ArrowBottomMedium,
      },
      SWAP: {
        disabled: isPtxServiceCtaExchangeDrawerDisabled || readOnlyModeEnabled || !hasFunds,
        customHandler: handleOpenSwap,
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

    // Partner stake route is only available if an eligible account is present. If not, the user will be redirected to the stake flow to select an account.
    if (partnerStakeRoute) {
      const { screen, params } = partnerStakeRoute;
      list.STAKE = {
        disabled: readOnlyModeEnabled,
        // @ts-expect-error - cannot infer screen & params type correctly. But this will go away if we do not return the NoFundsFlow when account is empty, or narrow the conditions of the return type.
        route: [screen, params],
        icon: IconsLegacy.CoinsMedium,
      };
    }

    if (canStakeCurrencyUsingLedgerLive || !currency) {
      list.STAKE = {
        disabled: readOnlyModeEnabled,
        customHandler: handleOpenStakeDrawer,
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
    readOnlyModeEnabled,
    hasCurrency,
    currency,
    handleOpenReceiveDrawer,
    isPtxServiceCtaExchangeDrawerDisabled,
    hasFunds,
    handleOpenSwap,
    canBeBought,
    canBeSold,
    partnerStakeRoute,
    canStakeCurrencyUsingLedgerLive,
    canBeRecovered,
    handleOpenStakeDrawer,
  ]);

  return { quickActionsList };
}

export default useQuickActions;
