import { useMemo } from "react";
import { AccountLikeArray } from "@ledgerhq/types-live";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { Icons } from "@ledgerhq/native-ui";
import { useRampCatalog } from "@ledgerhq/live-common/platform/providers/RampCatalogProvider/index";
import { filterRampCatalogEntries } from "@ledgerhq/live-common/platform/providers/RampCatalogProvider/helpers";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { NavigatorName, ScreenName } from "../../../const";
// eslint-disable-next-line import/named
import {
  readOnlyModeEnabledSelector,
  swapSelectableCurrenciesSelector,
} from "../../../reducers/settings";
import { ActionButtonEvent } from "..";
import ZeroBalanceDisabledModalContent from "../modals/ZeroBalanceDisabledModalContent";

type useAssetActionsProps = {
  currency?: CryptoCurrency | TokenCurrency;
  accounts?: AccountLikeArray;
};

const iconBuy = Icons.PlusMedium;
const iconSell = Icons.MinusMedium;
const iconSwap = Icons.BuyCryptoMedium;
const iconReceive = Icons.ArrowBottomMedium;
const iconSend = Icons.ArrowTopMedium;
const iconAddAccount = Icons.WalletMedium;

export default function useAssetActions({
  currency,
  accounts,
}: useAssetActionsProps): {
  mainActions: ActionButtonEvent[];
} {
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

  const swapSelectableCurrencies = useSelector(
    swapSelectableCurrenciesSelector,
  );
  const availableOnSwap =
    currency && swapSelectableCurrencies.includes(currency.id);

  const rampCatalog = useRampCatalog();
  const [canBeBought, canBeSold] = useMemo(() => {
    if (!rampCatalog.value || !currency) {
      return [false, false];
    }

    const onRampProviders = filterRampCatalogEntries(rampCatalog.value.onRamp, {
      tickers: [currency.ticker],
    });
    const offRampProviders = filterRampCatalogEntries(
      rampCatalog.value.offRamp,
      {
        tickers: [currency.ticker],
      },
    );

    return [onRampProviders.length > 0, offRampProviders.length > 0];
  }, [rampCatalog.value, currency]);

  const actions = useMemo<ActionButtonEvent[]>(
    () => [
      ...(canBeBought
        ? [
            {
              id: "buy",
              event: "button_clicked",
              eventProperties: {
                button: "buy",
              },
              label: t("exchange.buy.tabTitle"),
              Icon: iconBuy,
              navigationParams: [
                NavigatorName.Exchange,
                {
                  screen: ScreenName.ExchangeBuy,
                  params: {
                    defaultCurrencyId: currency?.id,
                  },
                },
              ],
            },
          ]
        : []),
      ...(canBeSold
        ? [
            {
              id: "sell",
              event: "button_clicked",
              eventProperties: {
                button: "sell",
              },
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
              ],
              disabled: areAccountsBalanceEmpty,
              modalOnDisabledClick: !readOnlyModeEnabled
                ? {
                    component: ZeroBalanceDisabledModalContent,
                  }
                : undefined,
            },
          ]
        : []),
      ...(hasAccounts && !readOnlyModeEnabled
        ? [
            ...(availableOnSwap
              ? [
                  {
                    id: "swap",
                    event: "button_clicked",
                    eventProperties: {
                      button: "swap",
                    },
                    label: t("transfer.swap.title"),
                    Icon: iconSwap,
                    navigationParams: [
                      NavigatorName.Swap,
                      {
                        screen: ScreenName.Swap,
                        params: { currencyId: currency?.id, defaultAccount },
                      },
                    ],
                    disabled: areAccountsBalanceEmpty,
                    modalOnDisabledClick: {
                      component: ZeroBalanceDisabledModalContent,
                    },
                  },
                ]
              : []),
            {
              id: "receive",
              event: "button_clicked",
              eventProperties: {
                button: "receive",
              },
              label: t("transfer.receive.title"),
              Icon: iconReceive,
              navigationParams: [
                NavigatorName.ReceiveFunds,
                defaultAccount
                  ? {
                      screen: ScreenName.ReceiveConfirmation,
                      params: {
                        accountId: defaultAccount.id,
                        parentId:
                          defaultAccount.type === "TokenAccount"
                            ? defaultAccount.parentId
                            : undefined,
                        currency,
                      },
                    }
                  : {
                      screen: ScreenName.ReceiveSelectCrypto,
                      params: {
                        filterCurrencyIds: currency ? [currency.id] : undefined,
                      },
                    },
              ],
            },
            {
              id: "send",
              event: "button_clicked",
              eventProperties: {
                button: "send",
              },
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
              ],
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
                    event: "button_clicked",
                    eventProperties: {
                      button: "add_account",
                    },
                    label: t("addAccountsModal.ctaAdd"),
                    Icon: iconAddAccount,
                    navigationParams: [
                      NavigatorName.AddAccounts,
                      {
                        screen: ScreenName.AddAccountsSelectCrypto,
                        params: {
                          filterCurrencyIds: currency
                            ? [currency.id]
                            : undefined,
                        },
                      },
                    ],
                  },
                ]
              : []),
          ]),
    ],
    [
      areAccountsBalanceEmpty,
      availableOnSwap,
      canBeBought,
      canBeSold,
      currency,
      defaultAccount,
      hasAccounts,
      readOnlyModeEnabled,
      t,
    ],
  );

  return {
    mainActions: actions,
  };
}
