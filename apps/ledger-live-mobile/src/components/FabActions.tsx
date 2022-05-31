import React, { memo, useMemo } from "react";

import { useTheme } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";

import { getAccountCurrency } from "@ledgerhq/live-common/lib/account";
import { useRampCatalog } from "@ledgerhq/live-common/lib/platform/providers/RampCatalogProvider";
import {
  filterRampCatalogEntries,
  getAllSupportedCryptoCurrencyIds,
} from "@ledgerhq/live-common/lib/platform/providers/RampCatalogProvider/helpers";

import {
  AccountLike,
  Account,
  CryptoCurrency,
} from "@ledgerhq/live-common/lib/types";

import { Icons } from "@ledgerhq/native-ui";

import {
  readOnlyModeEnabledSelector,
  swapSelectableCurrenciesSelector,
} from "../reducers/settings";
import { accountsCountSelector } from "../reducers/accounts";
import { NavigatorName, ScreenName } from "../const";
import FabAccountButtonBar, { ActionButton } from "./FabAccountButtonBar";
import useActions from "../screens/Account/hooks/useActions";

type FabAccountActionsProps = {
  account: AccountLike;
  parentAccount?: Account;
};

const iconBuy = Icons.PlusMedium;
const iconSell = Icons.MinusMedium;
const iconSwap = Icons.BuyCryptoMedium;
const iconReceive = Icons.ArrowBottomMedium;
const iconSend = Icons.ArrowTopMedium;
const iconAddAccount = Icons.WalletMedium;

export const FabAccountActionsComponent: React.FC<FabAccountActionsProps> = ({
  account,
  parentAccount,
}: FabAccountActionsProps) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const currency = getAccountCurrency(account);
  const swapSelectableCurrencies = useSelector(
    swapSelectableCurrenciesSelector,
  );
  const availableOnSwap =
    swapSelectableCurrencies.includes(currency.id) && account.balance.gt(0);
  const readOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector);

  const rampCatalog = useRampCatalog();

  const [canBeBought, canBeSold] = useMemo(() => {
    if (!rampCatalog.value || !currency) {
      return [false, false];
    }

    const allBuyableCryptoCurrencyIds = getAllSupportedCryptoCurrencyIds(
      rampCatalog.value.onRamp,
    );
    const allSellableCryptoCurrencyIds = getAllSupportedCryptoCurrencyIds(
      rampCatalog.value.offRamp,
    );

    return [
      allBuyableCryptoCurrencyIds.includes(currency.id),
      allSellableCryptoCurrencyIds.includes(currency.id),
    ];
  }, [rampCatalog.value, currency]);

  const actionButtonSwap: ActionButton = {
    navigationParams: [
      NavigatorName.Swap,
      {
        screen: ScreenName.Swap,
        params: {
          defaultAccount: account,
          defaultParentAccount: parentAccount,
        },
      },
    ],
    label: t("transfer.swap.main.header", { currency: currency.name }),
    Icon: iconSwap,
    event: "Swap Crypto Account Button",
    eventProperties: { currencyName: currency.name },
  };

  const actionButtonBuy: ActionButton = {
    navigationParams: [
      NavigatorName.Exchange,
      {
        screen: ScreenName.ExchangeBuy,
        params: {
          defaultCurrencyId: currency && currency.id,
          defaultAccountId: account && account.id,
        },
      },
    ],
    label: t("account.buy"),
    Icon: iconBuy,
    event: "Buy Crypto Account Button",
    eventProperties: {
      currencyName: currency.name,
    },
  };

  const actionButtonSell: ActionButton = {
    navigationParams: [
      NavigatorName.Exchange,
      {
        screen: ScreenName.ExchangeSell,
        params: {
          defaultCurrencyId: currency && currency.id,
          defaultAccountId: account && account.id,
        },
      },
    ],
    label: t("account.sell"),
    Icon: iconSell,
    event: "Sell Crypto Account Button",
    eventProperties: {
      currencyName: currency.name,
    },
  };

  const allActions: ActionButton[] = [
    ...(availableOnSwap ? [actionButtonSwap] : []),
    ...(!readOnlyModeEnabled && canBeBought ? [actionButtonBuy] : []),
    ...(!readOnlyModeEnabled && canBeSold ? [actionButtonSell] : []),
    ...useActions({ account, parentAccount, colors }),
  ];

  return (
    <FabAccountButtonBar
      buttons={allActions}
      account={account}
      parentAccount={parentAccount}
    />
  );
};

type Props = {
  account?: AccountLike;
  parentAccount?: Account;
  currency?: CryptoCurrency;
  accounts?: AccountLike[];
};

const FabMarketActionsComponent: React.FC<Props> = ({
  currency,
  accounts,
  ...props
}) => {
  const { t } = useTranslation();
  const readOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector);
  const hasAccounts = accounts?.length && accounts.length > 0;

  const defaultAccount = useMemo(() => (accounts ? accounts[0] : undefined), [
    accounts,
  ]);

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

  const actions = useMemo<ActionButton[]>(
    () => [
      ...(canBeBought
        ? [
            {
              event: "TransferExchange",
              label: t("exchange.buy.tabTitle"),
              Icon: iconBuy,
              navigationParams: [
                NavigatorName.Exchange,
                {
                  screen: ScreenName.ExchangeBuy,
                  params: {
                    defaultTicker:
                      currency &&
                      currency.ticker &&
                      currency.ticker.toUpperCase(),
                  },
                },
              ],
            },
          ]
        : []),
      ...(canBeSold
        ? [
            {
              event: "TransferExchange",
              label: t("exchange.sell.tabTitle"),
              Icon: iconSell,
              navigationParams: [
                NavigatorName.Exchange,
                {
                  screen: ScreenName.ExchangeSell,
                  params: {
                    defaultTicker:
                      currency &&
                      currency.ticker &&
                      currency.ticker.toUpperCase(),
                  },
                },
              ],
            },
          ]
        : []),
      ...(hasAccounts && !readOnlyModeEnabled
        ? [
            ...(availableOnSwap
              ? [
                  {
                    event: "TransferSwap",
                    label: t("transfer.swap.title"),
                    Icon: iconSwap,
                    navigationParams: [
                      NavigatorName.Swap,
                      {
                        screen: ScreenName.Swap,
                        params: { currencyId: currency?.id, defaultAccount },
                      },
                    ],
                    disabled: defaultAccount?.balance.lte(0),
                  },
                ]
              : []),
            {
              event: "TransferReceive",
              label: t("transfer.receive.title"),
              Icon: iconReceive,
              navigationParams: [
                NavigatorName.ReceiveFunds,
                {
                  screen: ScreenName.ReceiveSelectAccount,
                  params: { selectedCurrency: currency },
                },
              ],
            },
            {
              event: "TransferSend",
              label: t("transfer.send.title"),
              Icon: iconSend,
              navigationParams: [
                NavigatorName.SendFunds,
                {
                  screen: ScreenName.SendCoin,
                  params: { selectedCurrency: currency },
                },
              ],
              disabled: defaultAccount?.balance.lte(0),
            },
          ]
        : [
            ...(!readOnlyModeEnabled
              ? [
                  {
                    event: "TransferAddAccount",
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

  return <FabAccountButtonBar {...props} buttons={actions} />;
};

type FabActionsProps = {
  areAccountsEmpty?: boolean;
};

const FabActions: React.FC<FabActionsProps> = ({
  areAccountsEmpty = false,
}) => {
  const { t } = useTranslation();
  const readOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector);
  const accountsCount: number = useSelector(accountsCountSelector);
  const hasAccounts = accountsCount > 0;

  const actions = useMemo<ActionButton[]>(() => {
    const actionButtonBuy: ActionButton = {
      event: "TransferExchange",
      label: t("exchange.buy.tabTitle"),
      Icon: iconBuy,
      navigationParams: [
        NavigatorName.Exchange,
        {
          screen: ScreenName.ExchangeBuy,
        },
      ],
    };

    const actionButtonSell: ActionButton = {
      event: "TransferExchange",
      label: t("exchange.sell.tabTitle"),
      Icon: iconSell,
      navigationParams: [
        NavigatorName.Exchange,
        {
          screen: ScreenName.ExchangeSell,
        },
      ],
    };

    const actionButtonTransferSwap: ActionButton = {
      event: "TransferSwap",
      label: t("transfer.swap.title"),
      Icon: iconSwap,
      navigationParams: [
        NavigatorName.Swap,
        {
          screen: ScreenName.Swap,
        },
      ],
    };

    const actionButtonTransferReceive: ActionButton = {
      event: "TransferReceive",
      label: t("transfer.receive.title"),
      Icon: iconReceive,
      navigationParams: [
        NavigatorName.ReceiveFunds,
        {
          screen: ScreenName.ReceiveSelectAccount,
        },
      ],
    };

    const actionButtonTransferSend: ActionButton = {
      event: "TransferSend",
      label: t("transfer.send.title"),
      Icon: iconSend,
      navigationParams: [
        NavigatorName.SendFunds,
        {
          screen: ScreenName.SendCoin,
        },
      ],
      disabled: areAccountsEmpty,
    };

    return [
      ...(hasAccounts && !readOnlyModeEnabled
        ? [actionButtonTransferSwap]
        : []),
      actionButtonBuy,
      actionButtonSell,
      ...(hasAccounts && !readOnlyModeEnabled
        ? [actionButtonTransferReceive, actionButtonTransferSend]
        : []),
    ];
  }, [hasAccounts, readOnlyModeEnabled, t, areAccountsEmpty]);

  return <FabAccountButtonBar buttons={actions} />;
};

export const FabAccountActions = memo(FabAccountActionsComponent);

export const FabMarketActions = memo(FabMarketActionsComponent);

export default memo(FabActions);
