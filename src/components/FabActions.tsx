import React, { memo, useMemo } from "react";

import { useTheme } from "@react-navigation/native";
import { Trans } from "react-i18next";
import { useSelector } from "react-redux";

import { getAccountCurrency } from "@ledgerhq/live-common/lib/account";

import {
  AccountLike,
  Account,
  CryptoCurrency,
} from "@ledgerhq/live-common/lib/types";

import { Icons } from "@ledgerhq/native-ui";
import { isCurrencySupported } from "../screens/Exchange/coinifyConfig";

import {
  readOnlyModeEnabledSelector,
  swapSelectableCurrenciesSelector,
} from "../reducers/settings";
import { accountsCountSelector } from "../reducers/accounts";
import { NavigatorName, ScreenName } from "../const";
import FabAccountButtonBar from "./FabAccountButtonBar";
import useActions from "../screens/Account/hooks/useActions";
import useLendingActions from "../screens/Account/hooks/useLendingActions";

type Props = {
  account?: AccountLike;
  parentAccount?: Account;
  currency?: CryptoCurrency;
  accounts?: AccountLike[];
};

type FabAccountActionsProps = {
  account: AccountLike;
  parentAccount?: Account;
};

export const FabAccountActionsComponent = ({
  account,
  parentAccount,
}: FabAccountActionsProps) => {
  const { colors } = useTheme();

  const currency = getAccountCurrency(account);
  const swapSelectableCurrencies = useSelector(
    swapSelectableCurrenciesSelector,
  );
  const availableOnSwap =
    swapSelectableCurrencies.includes(currency.id) && account.balance.gt(0);
  const readOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector);

  const canBeBought = isCurrencySupported(currency, "buy");

  const allActions = [
    ...(!readOnlyModeEnabled && canBeBought
      ? [
          {
            navigationParams: [
              NavigatorName.Exchange,
              {
                screen: ScreenName.ExchangeBuy,
                params: {
                  accountId: account.id,
                  // mode: "buy",
                  parentId: parentAccount && parentAccount.id,
                },
              },
            ],
            label: <Trans i18nKey="account.buy" />,
            Icon: Icons.BuyCryptoAltMedium,
            event: "Buy Crypto Account Button",
            eventProperties: {
              currencyName: currency.name,
            },
          },
        ]
      : []),
    ...(availableOnSwap
      ? [
          {
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
            label: (
              <Trans
                i18nKey="transfer.swap.main.header"
                values={{ currency: currency.name }}
              />
            ),
            Icon: Icons.BuyCryptoMedium,
            event: "Swap Crypto Account Button",
            eventProperties: { currencyName: currency.name },
          },
        ]
      : []),
    ...useActions({ account, parentAccount, colors }),
  ];

  // Do not display separators as buttons. (they do not have a label)
  //
  // First, count the index at which there are 2 valid buttons.
  let counter = 0;
  const sliceIndex =
    allActions.findIndex(action => {
      if (action.label) counter++;
      return counter === 2;
    }) + 1;

  // Then slice from 0 to the index and ignore invalid button elements.
  // Chaining methods should not be a big deal given the size of the actions array.
  const buttons = allActions
    .slice(0, sliceIndex || undefined)
    .filter(action => !!action.label)
    .slice(0, 2);

  const actions = {
    default: sliceIndex ? allActions.slice(sliceIndex) : [],
    lending: useLendingActions({ account }),
  };

  return (
    <FabAccountButtonBar
      buttons={buttons}
      actions={actions}
      account={account}
      parentAccount={parentAccount}
    />
  );
};

const FabMarketActionsComponent = ({ currency, accounts, ...props }: Props) => {
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

  const canBeBought = currency && isCurrencySupported(currency, "buy");

  const actions = useMemo(
    () => [
      ...(canBeBought
        ? [
            {
              event: "TransferExchange",
              label: <Trans i18nKey="exchange.buy.tabTitle" />,
              Icon: Icons.BuyCryptoAltMedium,
              navigationParams: [
                NavigatorName.Exchange,
                {
                  screen: ScreenName.ExchangeBuy,
                  params: { currencyId: currency?.id, defaultAccount },
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
                    label: <Trans i18nKey="transfer.swap.title" />,
                    Icon: Icons.BuyCryptoMedium,
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
              label: <Trans i18nKey="transfer.receive.title" />,
              Icon: Icons.PlusMedium,
              navigationParams: [
                NavigatorName.ReceiveFunds,
                {
                  screen: ScreenName.ReceiveSelectAccount,
                  params: { selectedCurrency: currency },
                },
              ],
              type: "shade",
              outline: true,
            },
            {
              event: "TransferSend",
              label: <Trans i18nKey="transfer.send.title" />,
              Icon: Icons.MinusMedium,
              navigationParams: [
                NavigatorName.SendFunds,
                {
                  screen: ScreenName.SendCoin,
                  params: { selectedCurrency: currency },
                },
              ],
              type: "shade",
              outline: true,
              disabled: defaultAccount?.balance.lte(0),
            },
          ]
        : [
            ...(!readOnlyModeEnabled
              ? [
                  {
                    event: "TransferAddAccount",
                    label: <Trans i18nKey="addAccountsModal.ctaAdd" />,
                    Icon: Icons.WalletMedium,
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
      currency,
      defaultAccount,
      hasAccounts,
      readOnlyModeEnabled,
    ],
  );

  return <FabAccountButtonBar {...props} buttons={actions} />;
};

const FabActions = () => {
  const readOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector);
  const accountsCount: number = useSelector(accountsCountSelector);
  const hasAccounts = accountsCount > 0;

  const actions = useMemo(
    () => [
      {
        event: "TransferExchange",
        label: <Trans i18nKey="exchange.buy.tabTitle" />,
        Icon: Icons.BuyCryptoAltMedium,
        navigationParams: [
          NavigatorName.Exchange,
          {
            screen: ScreenName.ExchangeBuy,
          },
        ],
      },
      ...(hasAccounts && !readOnlyModeEnabled
        ? [
            {
              event: "TransferSwap",
              label: <Trans i18nKey="transfer.swap.title" />,
              Icon: Icons.BuyCryptoMedium,
              navigationParams: [
                NavigatorName.Swap,
                {
                  screen: ScreenName.Swap,
                },
              ],
            },
            {
              event: "TransferReceive",
              label: <Trans i18nKey="transfer.receive.title" />,
              Icon: Icons.PlusMedium,
              navigationParams: [
                NavigatorName.ReceiveFunds,
                {
                  screen: ScreenName.ReceiveSelectAccount,
                },
              ],
              type: "shade",
              outline: true,
            },
            {
              event: "TransferSend",
              label: <Trans i18nKey="transfer.send.title" />,
              Icon: Icons.MinusMedium,
              navigationParams: [
                NavigatorName.SendFunds,
                {
                  screen: ScreenName.SendCoin,
                },
              ],
              type: "shade",
              outline: true,
            },
            {
              event: "TransferAddAccount",
              label: <Trans i18nKey="addAccountsModal.ctaAdd" />,
              Icon: Icons.WalletMedium,
              navigationParams: [
                NavigatorName.AddAccounts,
                {
                  screen: ScreenName.AddAccountsSelectCrypto,
                },
              ],
              type: "shade",
              outline: true,
            },
          ]
        : [
            {
              event: "TransferAddAccount",
              label: <Trans i18nKey="addAccountsModal.ctaAdd" />,
              Icon: Icons.WalletMedium,
              navigationParams: [
                NavigatorName.AddAccounts,
                {
                  screen: ScreenName.AddAccountsSelectCrypto,
                },
              ],
              type: "shade",
              outline: true,
            },
          ]),
    ],
    [hasAccounts, readOnlyModeEnabled],
  );

  return <FabAccountButtonBar buttons={actions} />;
};

export const FabAccountActions = memo(FabAccountActionsComponent);

export const FabMarketActions = memo(FabMarketActionsComponent);

export default memo<Props>(FabActions);
