import { useMemo } from "react";
import { AccountLike, Account } from "@ledgerhq/types-live";
import {
  getAccountCurrency,
  getMainAccount,
  getAccountSpendableBalance,
} from "@ledgerhq/live-common/account/index";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { useRoute } from "@react-navigation/native";
import { IconsLegacy } from "@ledgerhq/native-ui";
import { useRampCatalog } from "@ledgerhq/live-common/platform/providers/RampCatalogProvider/useRampCatalog";
import { useFeature } from "@ledgerhq/live-config/featureFlags/index";
import { DefaultTheme } from "styled-components/native";
import { NavigatorName, ScreenName } from "~/const";
import { readOnlyModeEnabledSelector } from "~/reducers/settings";
import perFamilyAccountActions from "../../../generated/accountActions";

import ZeroBalanceDisabledModalContent from "~/components/FabActions/modals/ZeroBalanceDisabledModalContent";
import { ActionButtonEvent } from "~/components/FabActions";
import { useCanShowStake } from "./useCanShowStake";
import { PtxToast } from "~/components/Toast/PtxToast";
import { useFetchCurrencyAll } from "@ledgerhq/live-common/exchange/swap/hooks/index";

type Props = {
  account: AccountLike;
  parentAccount?: Account;
  colors?: DefaultTheme["colors"];
};

const iconBuy = IconsLegacy.PlusMedium;
const iconSell = IconsLegacy.MinusMedium;
const iconSwap = IconsLegacy.BuyCryptoMedium;

export default function useAccountActions({ account, parentAccount, colors }: Props): {
  mainActions: ActionButtonEvent[];
  secondaryActions: ActionButtonEvent[];
} {
  const readOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector);
  const route = useRoute();
  const { t } = useTranslation();

  const ptxServiceCtaScreens = useFeature("ptxServiceCtaScreens");

  const isPtxServiceCtaScreensDisabled = useMemo(
    () => !(ptxServiceCtaScreens?.enabled ?? true),
    [ptxServiceCtaScreens],
  );

  const currency = getAccountCurrency(account);
  const canShowStake = useCanShowStake(currency);

  const balance = getAccountSpendableBalance(account);
  const isZeroBalance = !balance.gt(0);
  const mainAccount = getMainAccount(account, parentAccount);
  // @ts-expect-error issue in typing
  const decorators = perFamilyAccountActions[mainAccount?.currency?.family];

  const { isCurrencyAvailable } = useRampCatalog();

  const canBeBought = !!currency && isCurrencyAvailable(currency.id, "onRamp");
  const canBeSold = !!currency && isCurrencyAvailable(currency.id, "offRamp");

  const { data: currenciesAll } = useFetchCurrencyAll();
  const availableOnSwap = currency && currenciesAll.includes(currency.id);

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
          defaultCurrency: currency,
          defaultParentAccount: parentAccount,
        },
      },
    ],
    label: t("transfer.swap.main.header", { currency: currency.name }),
    Icon: iconSwap,
    disabled: isPtxServiceCtaScreensDisabled || isZeroBalance,
    modalOnDisabledClick: {
      component: isPtxServiceCtaScreensDisabled ? PtxToast : ZeroBalanceDisabledModalContent,
    },
    event: "Swap Crypto Account Button",
    eventProperties: { currencyName: currency.name },
  };

  const actionButtonBuy: ActionButtonEvent = {
    id: "buy",
    disabled: isPtxServiceCtaScreensDisabled,
    modalOnDisabledClick: {
      component: PtxToast,
    },
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
    disabled: isPtxServiceCtaScreensDisabled || isZeroBalance,
    modalOnDisabledClick: {
      component: isPtxServiceCtaScreensDisabled ? PtxToast : ZeroBalanceDisabledModalContent,
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
    Icon: IconsLegacy.ArrowTopMedium,
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
    Icon: IconsLegacy.ArrowBottomMedium,
    ...extraReceiveActionParams,
  };

  const familySpecificMainActions: Array<ActionButtonEvent> =
    (decorators &&
      decorators.getMainActions &&
      decorators.getMainActions({
        account,
        parentAccount,
        colors,
        parentRoute: route,
      })) ||
    [];

  const mainActions = [
    ...(availableOnSwap ? [actionButtonSwap] : []),
    ...(!readOnlyModeEnabled && canBeBought ? [actionButtonBuy] : []),
    ...(!readOnlyModeEnabled && canBeSold ? [actionButtonSell] : []),
    ...(!readOnlyModeEnabled
      ? familySpecificMainActions.filter(action => action.id !== "stake" || canShowStake)
      : []),
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
        parentRoute: route,
      })) ||
    [];

  const secondaryActions = [...familySpecificSecondaryActions];

  return {
    mainActions,
    secondaryActions,
  };
}
