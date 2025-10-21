import { useMemo, useCallback } from "react";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useSelector } from "react-redux";
import { StackNavigationProp } from "@react-navigation/stack";
import { IconsLegacy } from "@ledgerhq/native-ui";
import { IconType } from "@ledgerhq/native-ui/components/Icon/type";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { useRampCatalog } from "@ledgerhq/live-common/platform/providers/RampCatalogProvider/useRampCatalog";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { AccountLike } from "@ledgerhq/types-live";
import { listCurrencies, filterCurrencies } from "@ledgerhq/live-common/currencies/helpers";
import { NavigatorName, ScreenName } from "~/const";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { EntryOf } from "~/types/helpers";
import { accountsCountSelector, areAccountsEmptySelector } from "../reducers/accounts";
import { readOnlyModeEnabledSelector } from "../reducers/settings";
import { useStake } from "LLM/hooks/useStake/useStake";
import { walletSelector } from "~/reducers/wallet";
import { getAccountCurrency, getParentAccount } from "@ledgerhq/coin-framework/lib/account/helpers";
import { shallowAccountsSelector } from "~/reducers/accounts";
import {
  ModularDrawerLocation,
  useModularDrawerController,
  useModularDrawerVisibility,
} from "LLM/features/ModularDrawer";
import { useDrawerConfiguration } from "@ledgerhq/live-common/dada-client/hooks/useDrawerConfiguration";
import { useStakingDrawer } from "~/components/Stake/useStakingDrawer";

export type QuickAction = {
  disabled: boolean;
  route?: EntryOf<BaseNavigatorStackParamList>;
  action?: () => void;
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
  const navigation = useNavigation<StackNavigationProp<BaseNavigatorStackParamList>>();

  const { isCurrencyAvailable } = useRampCatalog();

  const { isModularDrawerVisible } = useModularDrawerVisibility({
    modularDrawerFeatureFlagKey: "llmModularDrawer",
  });
  const modularDrawerVisible = isModularDrawerVisible({
    location: ModularDrawerLocation.LIVE_APP,
    liveAppId: "earn",
  });
  const { openDrawer } = useModularDrawerController();
  const { createDrawerConfiguration } = useDrawerConfiguration();

  const goToAccountStakeFlow = useStakingDrawer({
    navigation,
    parentRoute: route,
    alwaysShowNoFunds: false,
  });

  const readOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector);
  const hasAnyAccounts = useSelector(accountsCountSelector) > 0;
  const hasCurrencyAccounts = currency ? !!accounts?.length : hasAnyAccounts;
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

  // Custom stake action that handles modular drawer
  const handleStakeAction = useCallback(() => {
    if (modularDrawerVisible) {
      const currencies = currency
        ? [currency.id]
        : enabledCurrencies.concat(partnerSupportedAssets);
      const cryptoCurrencies = filterCurrencies(listCurrencies(true), {
        currencies: currencies || [],
      });

      const finalDrawerConfiguration = createDrawerConfiguration(undefined, "earn");
      openDrawer({
        currencies: cryptoCurrencies.map(c => c.id),
        flow: "stake",
        source: "quick_action_stake",
        enableAccountSelection: true,
        onAccountSelected: goToAccountStakeFlow,
        useCase: "earn",
        ...(finalDrawerConfiguration.assets && {
          assetsConfiguration: finalDrawerConfiguration.assets,
        }),
        ...(finalDrawerConfiguration.networks && {
          networksConfiguration: finalDrawerConfiguration.networks,
        }),
      });
    } else {
      // Fallback to traditional navigation
      navigation.navigate(NavigatorName.StakeFlow, {
        screen: ScreenName.Stake,
        params: {
          currencies: currency ? [currency.id] : undefined,
          parentRoute: route,
        },
      });
    }
  }, [
    modularDrawerVisible,
    currency,
    enabledCurrencies,
    partnerSupportedAssets,
    createDrawerConfiguration,
    openDrawer,
    goToAccountStakeFlow,
    navigation,
    route,
  ]);

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

    if (canStakeCurrencyUsingLedgerLive || !currency) {
      list.STAKE = {
        disabled: readOnlyModeEnabled,
        action: handleStakeAction,
        icon: IconsLegacy.CoinsMedium,
      };
    } else if (partnerStakeRoute) {
      // Partner stake route is only available if an eligible account is present
      const { screen, params } = partnerStakeRoute;
      list.STAKE = {
        disabled: readOnlyModeEnabled,
        route: [screen, params],
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
    canBeBought,
    canBeSold,
    partnerStakeRoute,
    canStakeCurrencyUsingLedgerLive,
    canBeRecovered,
    handleStakeAction,
  ]);

  return { quickActionsList };
}

export default useQuickActions;
