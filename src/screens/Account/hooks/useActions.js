/* @flow */
import React from "react";
import { View, StyleSheet } from "react-native";
import type { AccountLike, Account } from "@ledgerhq/live-common/lib/types";
import {
  getAccountCurrency,
  getMainAccount,
} from "@ledgerhq/live-common/lib/account";
import { useSelector } from "react-redux";
import { Trans } from "react-i18next";
import { getEnv } from "@ledgerhq/live-common/lib/env";
import { NavigatorName, ScreenName } from "../../../const";
import {
  readOnlyModeEnabledSelector,
  swapSupportedCurrenciesSelector,
} from "../../../reducers/settings";
import perFamilyAccountActions from "../../../generated/accountActions";
import { isCurrencySupported } from "../../Exchange/coinifyConfig";
import Swap from "../../../icons/Swap";
import Lending from "../../../icons/Lending";
import WalletConnect from "../../../icons/WalletConnect";
import Exchange from "../../../icons/Exchange";

type Props = {
  account: AccountLike,
  parentAccount: ?Account,
  colors: *,
};

export default function useActions({ account, parentAccount, colors }: Props) {
  const readOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector);
  const availableOnSwap = useSelector(state =>
    swapSupportedCurrenciesSelector(state, { accountId: account.id }),
  );
  const mainAccount = getMainAccount(account, parentAccount);
  const decorators = perFamilyAccountActions[mainAccount.currency.family];
  const currency = getAccountCurrency(account);

  const walletConnectAvailable =
    currency.id === "ethereum" && getEnv("WALLETCONNECT");

  const accountId = account.id;

  const availableOnCompound =
    account.type === "TokenAccount" && !!account.compoundBalance;

  const canBeBought = isCurrencySupported(currency, "buy");
  const canBeSold = isCurrencySupported(currency, "sell");

  const baseActions =
    (decorators &&
      decorators.getActions &&
      decorators.getActions({
        account,
        parentAccount,
        colors,
      })) ||
    [];

  const actions = [
    ...baseActions,
    ...(!readOnlyModeEnabled && canBeBought
      ? [
          {
            navigationParams: [NavigatorName.ExchangeBuyFlow, { accountId }],
            label: <Trans i18nKey="account.buy" />,
            Icon: Exchange,
            event: "Buy Crypto Account Button",
            eventProperties: {
              currencyName: currency.name,
            },
          },
        ]
      : []),
    ...(!readOnlyModeEnabled && canBeSold
      ? [
          {
            navigationParams: [NavigatorName.ExchangeSellFlow, { accountId }],
            label: <Trans i18nKey="account.sell" />,
            Icon: Exchange,
            event: "Sell Crypto Account Button",
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
    ...(availableOnCompound
      ? [
          {
            enableActions: "lending",
            label: (
              <Trans
                i18nKey="transfer.lending.actionTitle"
                values={{ currency: currency.name }}
              />
            ),
            Icon: Lending,
            event: "Lend Crypto Account Button",
            eventProperties: { currencyName: currency.name },
          },
        ]
      : []),
    ...(walletConnectAvailable
      ? [
          {
            Component: () => (
              <View
                style={[
                  styles.separator,
                  { backgroundColor: colors.separator },
                ]}
              />
            ),
          },
          {
            navigationParams: [
              NavigatorName.Base,
              {
                screen: ScreenName.WalletConnectScan,
                params: {
                  accountId: account.id,
                },
              },
            ],
            label: <Trans i18nKey="account.walletconnect" />,
            Icon: WalletConnect,
            event: "WalletConnect Account Button",
            eventProperties: { currencyName: currency.name },
          },
        ]
      : []),
  ];

  return actions;
}

const styles = StyleSheet.create({
  separator: {
    height: 1,
    marginVertical: 8,
    marginHorizontal: 8,
  },
});
