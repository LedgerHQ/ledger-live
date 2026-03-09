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
import { useOpenStakeDrawer } from "LLM/features/Stake";
import { useOpenReceiveDrawer } from "LLM/features/Receive";
import { useOpenSwap } from "LLM/features/Swap";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";
import { useOpenBuySell } from "LLM/features/Buy";

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
  const canBeSold = !currency || isCurrencyAvailable(currency.id, "offRamp");

  const { getCanStakeCurrency, enabledCurrencies, partnerSupportedAssets } = useStake();
  const canStakeCurrency = !currency ? false : getCanStakeCurrency(currency.id);

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
  const { handleOpenBuySell } = useOpenBuySell({
    currency,
    sourceScreenName: route.name,
  });

  const { shouldUseLazyOnboarding } = useWalletFeaturesConfig("mobile");

  const quickActionsList = useMemo(() => {
    const isLegacyRebornFlow = readOnlyModeEnabled && !shouldUseLazyOnboarding;

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
        disabled: isLegacyRebornFlow,
        customHandler: handleOpenReceiveDrawer,
        icon: IconsLegacy.ArrowBottomMedium,
      },
      SWAP: {
        disabled: isPtxServiceCtaExchangeDrawerDisabled || isLegacyRebornFlow || !hasFunds,
        customHandler: handleOpenSwap,
        icon: IconsLegacy.BuyCryptoMedium,
      },
    };

    if (canBeBought) {
      list.BUY = {
        disabled: isPtxServiceCtaExchangeDrawerDisabled || isLegacyRebornFlow,
        icon: IconsLegacy.PlusMedium,
        customHandler: () => handleOpenBuySell("buy"),
      };
    }

    if (canBeSold) {
      list.SELL = {
        disabled: isPtxServiceCtaExchangeDrawerDisabled || isLegacyRebornFlow || !hasCurrency,
        route: [
          NavigatorName.Exchange,
          {
            screen: ScreenName.ExchangeSell,
            params: { defaultCurrencyId: currency?.id },
          },
        ],
        icon: IconsLegacy.MinusMedium,
        customHandler: () => handleOpenBuySell("sell"),
      };
    }

    if (canStakeCurrency || !currency) {
      list.STAKE = {
        disabled: isLegacyRebornFlow,
        customHandler: handleOpenStakeDrawer,
        icon: IconsLegacy.CoinsMedium,
      };
    }

    list.WALLET_CONNECT = {
      disabled: isLegacyRebornFlow,
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
        disabled: isLegacyRebornFlow,
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
    shouldUseLazyOnboarding,
    hasCurrency,
    currency,
    handleOpenReceiveDrawer,
    isPtxServiceCtaExchangeDrawerDisabled,
    hasFunds,
    handleOpenSwap,
    handleOpenBuySell,
    canBeBought,
    canBeSold,
    canStakeCurrency,
    canBeRecovered,
    handleOpenStakeDrawer,
  ]);

  return { quickActionsList };
}

export default useQuickActions;
