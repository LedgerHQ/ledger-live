/* @flow */
import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import type { AccountLike, Account } from "@ledgerhq/live-common/lib/types";
import {
  getAccountCurrency,
  getMainAccount,
  getAccountSpendableBalance,
} from "@ledgerhq/live-common/lib/account";
import { useSelector } from "react-redux";
import { Trans } from "react-i18next";
import { NavigatorName, ScreenName } from "../../../const";
import { readOnlyModeEnabledSelector } from "../../../reducers/settings";
import perFamilyAccountActions from "../../../generated/accountActions";
import { isCurrencySupported } from "../../Exchange/coinifyConfig";
import Lending from "../../../icons/Lending";
import WalletConnect from "../../../icons/WalletConnect";
import Exchange from "../../../icons/Exchange";
import IconSend from "../../../icons/Send";
import IconReceive from "../../../icons/Receive";

type Props = {
  account: AccountLike,
  parentAccount: ?Account,
  colors: *,
};

export default function useActions({ account, parentAccount, colors }: Props) {
  const readOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector);
  const currency = getAccountCurrency(account);

  const balance = getAccountSpendableBalance(account);
  const mainAccount = getMainAccount(account, parentAccount);
  const decorators = perFamilyAccountActions[mainAccount.currency.family];

  const walletConnectAvailable = currency.id === "ethereum";

  const accountId = account.id;

  const availableOnCompound =
    account.type === "TokenAccount" && !!account.compoundBalance;

  const canBeSold = isCurrencySupported(currency, "sell");

  const extraSendActionParams = useMemo(
    () =>
      decorators && decorators.getExtraSendActionParams
        ? decorators.getExtraSendActionParams({ account, parentAccount })
        : {},
    [account, parentAccount, decorators],
  );

  const extraReceiveActionParams = useMemo(
    () =>
      decorators && decorators.getExtraSendActionParams
        ? decorators.getExtraReceiveActionParams({ account, parentAccount })
        : {},
    [account, parentAccount, decorators],
  );

  const SendAction = {
    navigationParams: [
      NavigatorName.SendFunds,
      {
        screen: ScreenName.SendSelectRecipient,
      },
    ],
    label: <Trans i18nKey="account.send" />,
    event: "AccountSend",
    Icon: IconSend,
    disabled: balance.lte(0),
    ...extraSendActionParams,
  };

  const ReceiveAction = {
    navigationParams: [
      NavigatorName.ReceiveFunds,
      {
        screen: ScreenName.ReceiveConnectDevice,
      },
    ],
    label: <Trans i18nKey="account.receive" />,
    event: "AccountReceive",
    Icon: IconReceive,
    ...extraReceiveActionParams,
  };

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
    ...(!readOnlyModeEnabled ? [SendAction] : []),
    ReceiveAction,
    ...baseActions,
    ...(!readOnlyModeEnabled && canBeSold
      ? [
          {
            navigationParams: [NavigatorName.ExchangeSellFlow, { accountId }],
            label: <Trans i18nKey="account.sell" />,
            Icon: Exchange,
            event: "Sell Crypto Account Button",
            eventProperties: {
              currencyName: currency?.name,
            },
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
                  accountId: account?.id,
                },
              },
            ],
            label: <Trans i18nKey="account.walletconnect" />,
            Icon: WalletConnect,
            event: "WalletConnect Account Button",
            eventProperties: { currencyName: currency?.name },
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
                values={{ currency: currency?.name }}
              />
            ),
            Icon: Lending,
            event: "Lend Crypto Account Button",
            eventProperties: { currencyName: currency?.name },
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
