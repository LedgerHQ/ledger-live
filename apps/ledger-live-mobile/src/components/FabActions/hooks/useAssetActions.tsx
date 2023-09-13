import { useMemo } from "react";
import { AccountLikeArray } from "@ledgerhq/types-live";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { IconsLegacy } from "@ledgerhq/native-ui";
import { getParentAccount, isTokenAccount } from "@ledgerhq/live-common/account/index";
import { useRampCatalog } from "@ledgerhq/live-common/platform/providers/RampCatalogProvider/index";
import { filterRampCatalogEntries } from "@ledgerhq/live-common/platform/providers/RampCatalogProvider/helpers";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { useRoute } from "@react-navigation/native";
import { NavigatorName, ScreenName } from "../../../const";
import { accountsSelector } from "../../../reducers/accounts";
import {
  readOnlyModeEnabledSelector,
  swapSelectableCurrenciesSelector,
} from "../../../reducers/settings";
import { ActionButtonEvent } from "..";
import ZeroBalanceDisabledModalContent from "../modals/ZeroBalanceDisabledModalContent";
import { sharedSwapTracking } from "../../../screens/Swap/utils";
import { PtxToast } from "../../Toast/PtxToast";

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
const iconStake = IconsLegacy.ClaimRewardsMedium;

export default function useAssetActions({ currency, accounts }: useAssetActionsProps): {
  mainActions: ActionButtonEvent[];
} {
  const route = useRoute();

  const ptxServiceCtaScreens = useFeature("ptxServiceCtaScreens");

  const { t } = useTranslation();
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
  const swapSelectableCurrencies = useSelector(swapSelectableCurrenciesSelector);
  const availableOnSwap = currency && swapSelectableCurrencies.includes(currency.id);

  const rampCatalog = useRampCatalog();
  const [canBeBought, canBeSold] = useMemo(() => {
    if (!rampCatalog.value || !currency) {
      return [false, false];
    }

    const onRampProviders = filterRampCatalogEntries(rampCatalog.value.onRamp, {
      tickers: [currency.ticker],
    });
    const offRampProviders = filterRampCatalogEntries(rampCatalog.value.offRamp, {
      tickers: [currency.ticker],
    });

    return [onRampProviders.length > 0, offRampProviders.length > 0];
  }, [rampCatalog.value, currency]);

  const featureFlag = useFeature("stakePrograms");
  const stakeFlagEnabled = featureFlag?.enabled;
  const listFlag = featureFlag?.params?.list;

  const canBeStaken = stakeFlagEnabled && listFlag && currency && listFlag.includes(currency?.id);
  const totalAccounts = useSelector(accountsSelector);
  const parentAccount = isTokenAccount(defaultAccount)
    ? getParentAccount(defaultAccount, totalAccounts)
    : undefined;

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
              testId: "market-buy-btn",
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
            ...(canBeStaken
              ? [
                  {
                    label: t("account.stake"),
                    Icon: iconStake,
                    event: "button_clicked",
                    eventProperties: {
                      source: "asset screen",
                      button: "stake",
                      currency: currency?.id?.toUpperCase(),
                      flow: "stake",
                    },
                    navigationParams: [
                      NavigatorName.StakeFlow,
                      {
                        screen: ScreenName.Stake,
                        params: {
                          currencies: [currency?.id],
                          parentRoute: route,
                        },
                      },
                    ] as const,
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
    ptxServiceCtaScreens,
    areAccountsBalanceEmpty,
    availableOnSwap,
    canBeBought,
    canBeSold,
    canBeStaken,
    currency,
    defaultAccount,
    hasAccounts,
    parentAccount,
    readOnlyModeEnabled,
    t,
    route,
  ]);

  return {
    mainActions: actions,
  };
}
