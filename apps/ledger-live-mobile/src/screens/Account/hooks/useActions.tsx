import React, { useMemo } from "react";
import { AccountLike, Account } from "@ledgerhq/live-common/lib/types";
import {
  getAccountCurrency,
  getMainAccount,
  getAccountSpendableBalance,
} from "@ledgerhq/live-common/lib/account";
import { useSelector } from "react-redux";
import { Trans } from "react-i18next";
import { Icons } from "@ledgerhq/native-ui";
import { NavigatorName, ScreenName } from "../../../const";
import { readOnlyModeEnabledSelector } from "../../../reducers/settings";
import perFamilyAccountActions from "../../../generated/accountActions";
import { isCurrencySupported } from "../../Exchange/coinifyConfig";
import WalletConnect from "../../../icons/WalletConnect";

type Props = {
  account: AccountLike;
  parentAccount?: Account;
  colors: any;
};

export default function useActions({ account, parentAccount, colors }: Props) {
  const readOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector);
  const currency = getAccountCurrency(account);

  const balance = getAccountSpendableBalance(account);
  const mainAccount = getMainAccount(account, parentAccount);
  const decorators =
    perFamilyAccountActions[
      mainAccount?.currency?.family as keyof typeof perFamilyAccountActions
    ];

  const isEthereum = currency.id === "ethereum";
  const isWalletConnectSupported = ["ethereum", "bsc", "polygon"].includes(
    currency.id,
  );

  const accountId = account.id;

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
    Icon: Icons.ArrowTopMedium,
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
    Icon: Icons.ArrowBottomMedium,
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
    ...(!readOnlyModeEnabled && canBeSold
      ? [
          {
            navigationParams: [NavigatorName.ExchangeSellFlow, { accountId }],
            label: <Trans i18nKey="account.sell" />,
            Icon: Icons.MinusMedium,
            event: "Sell Crypto Account Button",
            eventProperties: {
              currencyName: currency?.name,
            },
          },
        ]
      : []),
    ...(!readOnlyModeEnabled ? [SendAction] : []),
    ReceiveAction,
    ...baseActions,
    ...(isEthereum
      ? [
          {
            navigationParams: [
              NavigatorName.Base,
              {
                screen: ScreenName.PlatformApp,
                params: {
                  platform: "lido",
                  name: "Lido",
                },
              },
            ],
            label: <Trans i18nKey="account.stake" />,
            Icon: Icons.ClaimRewardsMedium,
            event: "Stake Ethereum Account Button",
            eventProperties: { currencyName: currency?.name },
          },
        ]
      : []),
    ...(isWalletConnectSupported
      ? [
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
  ];

  return actions;
}
