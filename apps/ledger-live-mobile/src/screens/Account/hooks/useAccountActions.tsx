import React, { useMemo } from "react";
import { AccountLike, Account } from "@ledgerhq/live-common/types/index";
import {
  getAccountCurrency,
  getMainAccount,
  getAccountSpendableBalance,
} from "@ledgerhq/live-common/account/index";
import { useSelector } from "react-redux";
import { Trans, useTranslation } from "react-i18next";
import { Icons } from "@ledgerhq/native-ui";
import { NavigatorName, ScreenName } from "../../../const";
// eslint-disable-next-line import/named
import {
  readOnlyModeEnabledSelector,
  swapSelectableCurrenciesSelector,
} from "../../../reducers/settings";
import perFamilyAccountActions from "../../../generated/accountActions";
import WalletConnect from "../../../icons/WalletConnect";
import { ActionButton } from "../../../components/FabActions/FabAccountButtonBar";
import { useRampCatalog } from "@ledgerhq/live-common/platform/providers/RampCatalogProvider/index";
import { getAllSupportedCryptoCurrencyIds } from "@ledgerhq/live-common/platform/providers/RampCatalogProvider/helpers";
import ZeroBalanceDisabledModalContent from "../../../components/FabActions/modals/ZeroBalanceDisabledModalContent";

type Props = {
  account: AccountLike;
  parentAccount?: Account;
  colors: any;
};

const iconBuy = Icons.PlusMedium;
const iconSell = Icons.MinusMedium;
const iconSwap = Icons.BuyCryptoMedium;

export default function useAccountActions({
  account,
  parentAccount,
  colors,
}: Props): {
  mainActions: ActionButton[];
  secondaryActions: ActionButton[];
} {
  const readOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector);
  const { t } = useTranslation();
  // const { colors } = useTheme();

  const currency = getAccountCurrency(account);

  const balance = getAccountSpendableBalance(account);
  const isZeroBalance = balance.gt(0);
  const mainAccount = getMainAccount(account, parentAccount);
  // @ts-expect-error issue in typing
  const decorators = perFamilyAccountActions[mainAccount?.currency?.family];

  const isEthereum = currency.id === "ethereum";
  const isWalletConnectSupported = ["ethereum", "bsc", "polygon"].includes(
    currency.id,
  );

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

  const swapSelectableCurrencies = useSelector(
    swapSelectableCurrenciesSelector,
  );
  const availableOnSwap = swapSelectableCurrencies.includes(currency.id);

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
    disabled: true,
    modalOnDisabledClick: {
      component: ZeroBalanceDisabledModalContent,
    },
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
    disabled: isZeroBalance,
    event: "Sell Crypto Account Button",
    eventProperties: {
      currencyName: currency.name,
    },
  };

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
    disabled: isZeroBalance,
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

  const mainActions = [
    ...(availableOnSwap ? [actionButtonSwap] : []),
    ...(!readOnlyModeEnabled && canBeBought ? [actionButtonBuy] : []),
    ...(!readOnlyModeEnabled && canBeSold ? [actionButtonSell] : []),
    ...(!readOnlyModeEnabled ? [SendAction] : []),
    ReceiveAction,
  ];
  const secondaryActions = [
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

  return {
    mainActions,
    secondaryActions,
  };
}
