// @flow;
import React from "react";

import { useTheme } from "@react-navigation/native";
import { Trans } from "react-i18next";
import { useSelector } from "react-redux";

import { getAccountCurrency } from "@ledgerhq/live-common/lib/account";

import type { AccountLike, Account } from "@ledgerhq/live-common/lib/types";

import { isCurrencySupported } from "../screens/Exchange/coinifyConfig";

import {
  flattenedSwapSupportedCurrenciesSelector,
  readOnlyModeEnabledSelector,
} from "../reducers/settings";
import { accountsCountSelector } from "../reducers/accounts";
import { NavigatorName, ScreenName } from "../const";
import FabAccountButtonBar from "./FabAccountButtonBar";
import Exchange from "../icons/Exchange";
import Swap from "../icons/Swap";
import useActions from "../screens/Account/hooks/useActions";
import useLendingActions from "../screens/Account/hooks/useLendingActions";

type Props = {
  account?: AccountLike,
  parentAccount?: Account,
};

type FabAccountActionsProps = {
  account: AccountLike,
  parentAccount?: Account,
};

function FabAccountActions({ account, parentAccount }: FabAccountActionsProps) {
  const { colors } = useTheme();

  const currency = getAccountCurrency(account);
  const availableOnSwap = useSelector(state =>
    flattenedSwapSupportedCurrenciesSelector(state),
  );
  const readOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector);

  const canBeBought = isCurrencySupported(currency, "buy");

  const allActions = [
    ...(!readOnlyModeEnabled && canBeBought
      ? [
          {
            navigationParams: [
              NavigatorName.ExchangeBuyFlow,
              {
                screen: ScreenName.ExchangeConnectDevice,
                params: {
                  account,
                  mode: "buy",
                  parentId:
                    account.type !== "Account" ? account.parentId : undefined,
                },
              },
            ],
            label: <Trans i18nKey="account.buy" />,
            Icon: Exchange,
            event: "Buy Crypto Account Button",
            eventProperties: {
              currencyName: currency.name,
            },
          },
        ]
      : []),
    ...(availableOnSwap.includes(currency)
      ? [
          {
            navigationParams: [
              NavigatorName.Swap,
              {
                screen: ScreenName.SwapFormOrHistory,
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
            Icon: Swap,
            event: "Swap Crypto Account Button",
            eventProperties: { currencyName: currency.name },
          },
        ]
      : []),
    ...useActions({ account, parentAccount, colors }),
  ];

  const buttons = allActions.slice(0, 2);

  const actions = {
    default: allActions.slice(2),
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
}

function FabActions({ account, parentAccount }: Props) {
  const readOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector);
  const accountsCount = useSelector(accountsCountSelector);

  if (account)
    return (
      <FabAccountActions account={account} parentAccount={parentAccount} />
    );

  const actions = [
    {
      event: "TransferExchange",
      label: <Trans i18nKey="exchange.buy.tabTitle" />,
      Icon: Exchange,
      navigationParams: [
        NavigatorName.Exchange,
        { screen: ScreenName.ExchangeBuy },
      ],
    },
    ...(accountsCount > 0 && !readOnlyModeEnabled
      ? [
          {
            event: "TransferSwap",
            label: <Trans i18nKey="transfer.swap.title" />,
            Icon: Swap,
            navigationParams: [
              NavigatorName.Swap,
              {
                screen: ScreenName.SwapProviders,
              },
            ],
          },
        ]
      : []),
  ];

  return <FabAccountButtonBar buttons={actions} />;
}

export default FabActions;
