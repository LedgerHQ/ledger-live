import React, { memo, useCallback, useMemo } from "react";

import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";

import { useRampCatalog } from "@ledgerhq/live-common/platform/providers/RampCatalogProvider/index";
import { filterRampCatalogEntries } from "@ledgerhq/live-common/platform/providers/RampCatalogProvider/helpers";
import {
  AccountLike,
  Account,
  CryptoCurrency,
} from "@ledgerhq/live-common/types/index";

import { Icons, QuickActionList } from "@ledgerhq/native-ui";

import { Linking } from "react-native";
import { useTheme } from "styled-components/native";
import { QuickActionButtonProps } from "@ledgerhq/native-ui/components/cta/QuickAction/QuickActionButton";
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

export const FabAccountMainActionsComponent: React.FC<FabAccountActionsProps> = ({
  account,
  parentAccount,
}: FabAccountActionsProps) => {
  const { colors } = useTheme();
  const navigation = useNavigation();

  const { mainActions } = useActions({ account, parentAccount, colors });

  const onNavigate = useCallback(
    (name: string, options?: any) => {
      const accountId = account ? account.id : undefined;
      const parentId = parentAccount ? parentAccount.id : undefined;
      navigation.navigate(name, {
        ...options,
        params: {
          ...(options ? options.params : {}),
          accountId,
          parentId,
        },
      });
    },
    [account, parentAccount, navigation],
  );

  const onPress = useCallback(
    (data: ActionButton) => {
      const { navigationParams, linkUrl } = data;
      if (linkUrl) {
        Linking.openURL(linkUrl);
      } else if (navigationParams) {
        onNavigate(...navigationParams);
      }
    },
    [onNavigate],
  );

  const quickActions: QuickActionButtonProps[] = mainActions.map(action => ({
    Icon: action.Icon,
    children: action.label,
    onPress: () => onPress(action),
  }));

  return (
    <QuickActionList
      data={quickActions}
      numColumns={
        quickActions.length === 2 || quickActions.length === 4 ? 2 : 3
      }
    />
  );
};

export const FabAccountActionsComponent: React.FC<FabAccountActionsProps> = ({
  account,
  parentAccount,
}: FabAccountActionsProps) => {
  const { colors } = useTheme();
  const { secondaryActions } = useActions({
    account,
    parentAccount,
    colors,
  });

  return (
    <FabAccountButtonBar
      buttons={secondaryActions}
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
