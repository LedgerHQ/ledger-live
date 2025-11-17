import { useMemo } from "react";
import { AccountLikeArray } from "@ledgerhq/types-live";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { IconsLegacy } from "@ledgerhq/native-ui";
import {
  getAccountCurrency,
  getParentAccount,
  isTokenAccount,
} from "@ledgerhq/live-common/account/index";
import { useRampCatalog } from "@ledgerhq/live-common/platform/providers/RampCatalogProvider/useRampCatalog";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { useRoute } from "@react-navigation/native";
import { NavigatorName, ScreenName } from "~/const";
import { readOnlyModeEnabledSelector } from "~/reducers/settings";
import { ActionButtonEvent } from "..";
import ZeroBalanceDisabledModalContent from "../modals/ZeroBalanceDisabledModalContent";
import { sharedSwapTracking } from "~/screens/Swap/utils";
import { useFetchCurrencyAll } from "@ledgerhq/live-common/exchange/swap/hooks/index";
import { PtxToast } from "../../Toast/PtxToast";
import { getStakeLabelLocaleBased } from "~/helpers/getStakeLabelLocaleBased";
import { useStake } from "LLM/hooks/useStake/useStake";
import { flattenAccountsSelector } from "~/reducers/accounts";
import { useOpenStakeDrawer } from "LLM/features/Stake";
import { useOpenReceiveDrawer } from "LLM/features/Receive";

type useAssetActionsProps = {
  currency?: CryptoCurrency | TokenCurrency;
  accounts?: AccountLikeArray;
};

const iconBuy = IconsLegacy.PlusMedium;
const iconSell = IconsLegacy.MinusMedium;
const iconSwap = IconsLegacy.BuyCryptoMedium;
const iconReceive = IconsLegacy.ArrowBottomMedium;
const iconSend = IconsLegacy.ArrowTopMedium;
const iconAddAccount = IconsLegacy.WalletMedium;
const iconStake = IconsLegacy.CoinsMedium;

export default function useAssetActions({ currency, accounts }: useAssetActionsProps): {
  mainActions: ActionButtonEvent[];
} {
  const route = useRoute();
  const { data: currenciesAll } = useFetchCurrencyAll();

  const ptxServiceCtaScreens = useFeature("ptxServiceCtaScreens");

  const { t } = useTranslation();
  const stakeLabel = getStakeLabelLocaleBased();

  const readOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector);
  const hasAccounts = accounts?.length && accounts.length > 0;
  const areAccountsBalanceEmpty = useMemo(
    () => (accounts ? accounts.every(account => account.balance.lte(0)) : true),
    [accounts],
  );
  const defaultAccount = useMemo(
    () => (accounts && accounts.length === 1 ? accounts[0] : undefined),
    [accounts],
  );

  const availableOnSwap = currency && currenciesAll.includes(currency.id);

  const { isCurrencyAvailable } = useRampCatalog();

  const canBeBought = !!currency && isCurrencyAvailable(currency.id, "onRamp");
  const canBeSold = !!currency && isCurrencyAvailable(currency.id, "offRamp");

  const totalAccounts = useSelector(flattenAccountsSelector);
  const parentAccount = isTokenAccount(defaultAccount)
    ? getParentAccount(defaultAccount, totalAccounts)
    : undefined;

  const { getCanStakeCurrency } = useStake();
  const accountCurrency = !defaultAccount ? null : getAccountCurrency(defaultAccount);
  const assetId = !currency ? accountCurrency?.id : currency.id;
  const canStakeCurrency = !assetId ? false : getCanStakeCurrency(assetId);

  const { handleOpenStakeDrawer, isModularDrawerEnabled: isModularDrawerEnabledStake } =
    useOpenStakeDrawer({
      sourceScreenName: "asset_action",
      currencies: currency ? [currency.id] : undefined,
    });
  const { handleOpenReceiveDrawer, isModularDrawerEnabled: isModularDrawerEnabledReceive } =
    useOpenReceiveDrawer({
      sourceScreenName: "asset",
      currency,
    });
  const noah = useFeature("noah");

  const actions = useMemo<ActionButtonEvent[]>(() => {
    const isPtxServiceCtaScreensDisabled = !(ptxServiceCtaScreens?.enabled ?? true);

    return [
      ...(canBeBought
        ? [
            {
              id: "buy",
              label: t("exchange.buy.tabTitle"),
              Icon: iconBuy,
              disabled: isPtxServiceCtaScreensDisabled,
              modalOnDisabledClick: {
                component: PtxToast,
              },
              navigationParams: [
                NavigatorName.Exchange,
                {
                  screen: ScreenName.ExchangeBuy,
                  params: {
                    defaultCurrencyId: currency?.id,
                  },
                },
              ] as const,
            },
          ]
        : []),
      ...(canBeSold
        ? [
            {
              id: "sell",
              label: t("exchange.sell.tabTitle"),
              Icon: iconSell,
              navigationParams: [
                NavigatorName.Exchange,
                {
                  screen: ScreenName.ExchangeSell,
                  params: {
                    defaultCurrencyId: currency?.id,
                  },
                },
              ] as const,
              disabled: isPtxServiceCtaScreensDisabled || areAccountsBalanceEmpty,
              modalOnDisabledClick: {
                component: isPtxServiceCtaScreensDisabled
                  ? PtxToast
                  : ZeroBalanceDisabledModalContent,
              },
            },
          ]
        : []),
      ...(hasAccounts && !readOnlyModeEnabled
        ? [
            ...(availableOnSwap
              ? [
                  {
                    label: t("account.swap"),
                    Icon: iconSwap,
                    event: "button_clicked",
                    eventProperties: {
                      ...sharedSwapTracking,
                      button: "swap",
                    },
                    navigationParams: [
                      NavigatorName.Swap,
                      {
                        screen: ScreenName.Swap,
                        params: {
                          defaultAccount,
                          defaultCurrency: currency,
                          defaultParentAccount: parentAccount,
                        },
                      },
                    ] as const,
                    disabled: isPtxServiceCtaScreensDisabled || areAccountsBalanceEmpty,
                    modalOnDisabledClick: {
                      component: isPtxServiceCtaScreensDisabled
                        ? PtxToast
                        : ZeroBalanceDisabledModalContent,
                    },
                  },
                ]
              : []),
            ...(canStakeCurrency && assetId
              ? [
                  {
                    label: t(stakeLabel),
                    Icon: iconStake,
                    event: "button_clicked",
                    eventProperties: {
                      button: "stake",
                      currency:
                        currency?.ticker ?? accountCurrency?.ticker ?? assetId.toUpperCase(),
                      flow: "stake",
                    },
                    navigationParams: [
                      NavigatorName.StakeFlow,
                      {
                        screen: ScreenName.Stake,
                        params: {
                          currencies: [assetId],
                          parentRoute: route,
                        },
                      },
                    ] as const,
                    customHandler: isModularDrawerEnabledStake ? handleOpenStakeDrawer : undefined,
                  },
                ]
              : []),
            {
              id: "receive",
              label: t("transfer.receive.title"),
              Icon: iconReceive,
              navigationParams: [
                NavigatorName.ReceiveFunds,
                {
                  screen: ScreenName.ReceiveSelectAccount,
                  params: {
                    currency,
                  },
                },
              ] as const,
              // We have two features getting enabled at the same time that change the entry point of receive funds
              // if noah is active that takes precedence ReceiveFundsNavigator is where that gets used -> ReceiveFundsOptions is therefore where the MAD draw will be opened if active
              // if modular drawer is enabled but noah is not then go there
              // if neither is enabled we'll go through the old flow
              customHandler:
                isModularDrawerEnabledReceive && !noah?.enabled
                  ? handleOpenReceiveDrawer
                  : undefined,
            },
            {
              id: "send",
              label: t("transfer.send.title"),
              Icon: iconSend,
              navigationParams: [
                NavigatorName.SendFunds,
                defaultAccount
                  ? {
                      screen: ScreenName.SendSelectRecipient,
                      params: {
                        accountId: defaultAccount.id,
                        parentId:
                          defaultAccount.type === "TokenAccount"
                            ? defaultAccount.parentId
                            : undefined,
                      },
                    }
                  : {
                      screen: ScreenName.SendCoin,
                      params: { selectedCurrency: currency },
                    },
              ] as const,
              disabled: areAccountsBalanceEmpty,
              modalOnDisabledClick: {
                component: ZeroBalanceDisabledModalContent,
              },
            },
          ]
        : [
            ...(!readOnlyModeEnabled
              ? [
                  {
                    id: "add_account",
                    label: t("addAccountsModal.ctaAdd"),
                    Icon: iconAddAccount,
                    navigationParams: [
                      NavigatorName.AddAccounts,
                      {
                        screen: ScreenName.AddAccountsSelectCrypto,
                        params: {
                          filterCurrencyIds: currency ? [currency.id] : undefined,
                        },
                      },
                    ] as const,
                  },
                ]
              : []),
          ]),
    ];
  }, [
    ptxServiceCtaScreens?.enabled,
    canBeBought,
    t,
    currency,
    canBeSold,
    areAccountsBalanceEmpty,
    hasAccounts,
    readOnlyModeEnabled,
    availableOnSwap,
    defaultAccount,
    parentAccount,
    canStakeCurrency,
    assetId,
    stakeLabel,
    accountCurrency?.ticker,
    route,
    isModularDrawerEnabledStake,
    handleOpenStakeDrawer,
    isModularDrawerEnabledReceive,
    handleOpenReceiveDrawer,
    noah,
  ]);

  return {
    mainActions: actions,
  };
}
