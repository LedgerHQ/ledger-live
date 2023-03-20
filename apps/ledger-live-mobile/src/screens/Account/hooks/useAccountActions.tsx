import { useMemo } from "react";
import { AccountLike, Account } from "@ledgerhq/types-live";
import {
  getAccountCurrency,
  getMainAccount,
  getAccountSpendableBalance,
} from "@ledgerhq/live-common/account/index";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { Icons } from "@ledgerhq/native-ui";
import { useRampCatalog } from "@ledgerhq/live-common/platform/providers/RampCatalogProvider/index";
import { getAllSupportedCryptoCurrencyIds } from "@ledgerhq/live-common/platform/providers/RampCatalogProvider/helpers";
import { DefaultTheme } from "styled-components/native";
import { NavigatorName, ScreenName } from "../../../const";
import {
  readOnlyModeEnabledSelector,
  swapSelectableCurrenciesSelector,
} from "../../../reducers/settings";
import perFamilyAccountActions from "../../../generated/accountActions";
import WalletConnect from "../../../icons/WalletConnect";
import ZeroBalanceDisabledModalContent from "../../../components/FabActions/modals/ZeroBalanceDisabledModalContent";
import { ActionButtonEvent } from "../../../components/FabActions";

type Props = {
  account: AccountLike;
  parentAccount?: Account;
  colors?: DefaultTheme["colors"];
};

const iconBuy = Icons.PlusMedium;
const iconSell = Icons.MinusMedium;
const iconSwap = Icons.BuyCryptoMedium;

export default function useAccountActions({
  account,
  parentAccount,
  colors,
}: Props): {
  mainActions: ActionButtonEvent[];
  secondaryActions: ActionButtonEvent[];
} {
  const readOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector);
  const { t } = useTranslation();

  const currency = getAccountCurrency(account);

  const balance = getAccountSpendableBalance(account);
  const isZeroBalance = !balance.gt(0);
  const mainAccount = getMainAccount(account, parentAccount);
  // @ts-expect-error issue in typing
  const decorators = perFamilyAccountActions[mainAccount?.currency?.family];

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

  const actionButtonSwap: ActionButtonEvent = {
    id: "swap",
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
    disabled: isZeroBalance,
    modalOnDisabledClick: {
      component: ZeroBalanceDisabledModalContent,
    },
    event: "Swap Crypto Account Button",
    eventProperties: { currencyName: currency.name },
  };

  const actionButtonBuy: ActionButtonEvent = {
    id: "buy",
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

  const actionButtonSell: ActionButtonEvent = {
    id: "sell",
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
    modalOnDisabledClick: {
      component: ZeroBalanceDisabledModalContent,
    },
    event: "Sell Crypto Account Button",
    eventProperties: {
      currencyName: currency.name,
    },
  };

  const SendAction = {
    id: "send",
    navigationParams: [
      NavigatorName.SendFunds,
      {
        screen: ScreenName.SendSelectRecipient,
      },
    ],
    label: t("account.send"),
    event: "AccountSend",
    Icon: Icons.ArrowTopMedium,
    disabled: isZeroBalance,
    modalOnDisabledClick: {
      component: ZeroBalanceDisabledModalContent,
    },
    ...extraSendActionParams,
  };

  const ReceiveAction = {
    id: "receive",
    navigationParams: [
      NavigatorName.ReceiveFunds,
      {
        screen: ScreenName.ReceiveConfirmation,
        params: {
          accountId: account.id,
          currency,
        },
      },
    ],
    label: t("account.receive"),
    event: "AccountReceive",
    Icon: Icons.ArrowBottomMedium,
    ...extraReceiveActionParams,
  };

  const familySpecificMainActions =
    (decorators &&
      decorators.getMainActions &&
      decorators.getMainActions({
        account,
        parentAccount,
        colors,
      })) ||
    [];

  const mainActions = [
    ...(availableOnSwap ? [actionButtonSwap] : []),
    ...(!readOnlyModeEnabled && canBeBought ? [actionButtonBuy] : []),
    ...(!readOnlyModeEnabled && canBeSold ? [actionButtonSell] : []),
    ...(!readOnlyModeEnabled ? familySpecificMainActions : []),
    ...(!readOnlyModeEnabled ? [SendAction] : []),
    ReceiveAction,
  ];

  const familySpecificSecondaryActions =
    (decorators &&
      decorators.getSecondaryActions &&
      decorators.getSecondaryActions({
        account,
        parentAccount,
        colors,
      })) ||
    [];

  const secondaryActions = [
    ...familySpecificSecondaryActions,
    ...(isWalletConnectSupported
      ? [
          {
            id: "walletconnect",
            navigationParams: [
              NavigatorName.Base,
              {
                screen: NavigatorName.WalletConnect,
                params: {
                  screen: ScreenName.WalletConnectScan,
                  params: {
                    accountId: account?.id,
                  },
                },
              },
            ],
            label: t("account.walletconnect"),
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
