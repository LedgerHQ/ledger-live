// @flow;
import React from "react";

import { useTheme } from "@react-navigation/native";
import { Trans } from "react-i18next";
import { useSelector } from "react-redux";

import { getAccountCurrency } from "@ledgerhq/live-common/lib/account";

import type { AccountLike, Account } from "@ledgerhq/live-common/lib/types";

import { isCurrencySupported } from "../screens/Exchange/coinifyConfig";

import {
  swapSelectableCurrenciesSelector,
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
    swapSelectableCurrenciesSelector(state),
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
    ...(availableOnSwap.includes(currency.id)
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
            Icon: Swap,
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
                screen: ScreenName.Swap,
              },
            ],
          },
        ]
      : []),
  ];

  return <FabAccountButtonBar buttons={actions} />;
}

export default FabActions;
