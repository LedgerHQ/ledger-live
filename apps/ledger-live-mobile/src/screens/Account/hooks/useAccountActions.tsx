import { useMemo } from "react";
import { AccountLike, Account } from "@ledgerhq/types-live";
import {
  getAccountCurrency,
  getMainAccount,
  getAccountSpendableBalance,
} from "@ledgerhq/live-common/account/index";
import { useSelector } from "~/context/hooks";
import { useTranslation } from "~/context/Locale";
import { useRoute } from "@react-navigation/native";
import { IconsLegacy } from "@ledgerhq/native-ui";
import { useRampCatalog } from "@ledgerhq/live-common/platform/providers/RampCatalogProvider/useRampCatalog";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { useNewSendFlowFeature } from "LLM/features/Send/hooks/useNewSendFlowFeature";
import { DefaultTheme } from "styled-components/native";
import { NavigatorName, ScreenName } from "~/const";
import { readOnlyModeEnabledSelector } from "~/reducers/settings";
import perFamilyAccountActions from "../../../generated/accountActions";

import ZeroBalanceDisabledModalContent from "~/components/FabActions/modals/ZeroBalanceDisabledModalContent";
import { ActionButtonEvent } from "~/components/FabActions";
import { PtxToast } from "~/components/Toast/PtxToast";
import { useFetchCurrencyAll } from "@ledgerhq/live-common/exchange/swap/hooks/index";
import { walletSelector } from "~/reducers/wallet";
import { useStake } from "LLM/hooks/useStake/useStake";

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
  const walletState = useSelector(walletSelector);

  const ptxServiceCtaScreens = useFeature("ptxServiceCtaScreens");

  const isPtxServiceCtaScreensDisabled = useMemo(
    () => !(ptxServiceCtaScreens?.enabled ?? true),
    [ptxServiceCtaScreens],
  );

  const currency = getAccountCurrency(account);

  const { getCanStakeUsingLedgerLive, getCanStakeUsingPlatformApp, getRouteParamsForPlatformApp } =
    useStake();

  const canStakeUsingLedgerLive = useMemo(
    () => getCanStakeUsingLedgerLive(currency.id),
    [getCanStakeUsingLedgerLive, currency.id],
  );
  const canStakeUsingPlatformApp = useMemo(
    () => getCanStakeUsingPlatformApp(currency.id),
    [getCanStakeUsingPlatformApp, currency.id],
  );
  const canOnlyStakeUsingLedgerLive = useMemo(
    () => canStakeUsingLedgerLive && !canStakeUsingPlatformApp,
    [canStakeUsingLedgerLive, canStakeUsingPlatformApp],
  );

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

  const actionButtonSwap: ActionButtonEvent = useMemo(
    () => ({
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
      label: t("account.swap", { currency: currency.name }),
      Icon: iconSwap,
      disabled: false,
      event: "Swap Crypto Account Button",
      eventProperties: { currencyName: currency.name },
    }),
    [currency, account, parentAccount, t],
  );

  const actionButtonBuy: ActionButtonEvent = useMemo(
    () => ({
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
            defaultCurrencyId: currency?.id,
            defaultAccountId: account?.id,
          },
        },
      ],
      label: t("account.buy"),
      Icon: iconBuy,
      event: "Buy Crypto Account Button",
      eventProperties: {
        currencyName: currency.name,
      },
    }),
    [isPtxServiceCtaScreensDisabled, currency, account, t],
  );

  const actionButtonSell: ActionButtonEvent = useMemo(
    () => ({
      id: "sell",
      navigationParams: [
        NavigatorName.Exchange,
        {
          screen: ScreenName.ExchangeSell,
          params: {
            defaultCurrencyId: currency?.id,
            defaultAccountId: account?.id,
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
    }),
    [isPtxServiceCtaScreensDisabled, currency, account, t, isZeroBalance],
  );

  const { isEnabledForFamily, getFamilyFromAccount } = useNewSendFlowFeature();
  const accountFamily = getFamilyFromAccount(account, parentAccount);
  const shouldUseNewFlow = isEnabledForFamily(accountFamily);

  const SendAction = useMemo(
    () => ({
      id: "send",
      navigationParams: shouldUseNewFlow
        ? [
            NavigatorName.SendFlow,
            {
              params: {
                account,
                parentAccount,
              },
            },
          ]
        : [
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
    }),
    [shouldUseNewFlow, account, parentAccount, extraSendActionParams, t, isZeroBalance],
  );

  const ReceiveAction = useMemo(
    () => ({
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
    }),
    [extraReceiveActionParams, t, account.id, currency],
  );

  const platformStakeRoute = useMemo(
    () => getRouteParamsForPlatformApp(account, walletState, parentAccount),
    [getRouteParamsForPlatformApp, account, walletState, parentAccount],
  );

  const StakeAction = useMemo(
    () =>
      canStakeUsingPlatformApp && platformStakeRoute
        ? {
            id: "stake",
            disabled: isZeroBalance,
            navigationParams: [NavigatorName.Base, platformStakeRoute],
            label: t("account.stake"),
            Icon: IconsLegacy.CoinsMedium,
            event: "button_clicked",
            eventProperties: {
              button: "stake",
              currency: currency.ticker,
              page: "Account Page",
              isRedirectConfig: true,
              partner: platformStakeRoute?.params?.platform,
            },
          }
        : null,
    [canStakeUsingPlatformApp, platformStakeRoute, isZeroBalance, t, currency.ticker],
  );

  const familySpecificMainActions: Array<ActionButtonEvent> = useMemo(
    () =>
      decorators?.getMainActions?.({
        walletState,
        account,
        parentAccount,
        colors,
        parentRoute: route,
      }) ?? [],
    [walletState, account, parentAccount, colors, route, decorators],
  );

  const mainActions = useMemo(
    () => [
      ...(availableOnSwap ? [actionButtonSwap] : []),
      ...(!readOnlyModeEnabled && canBeBought ? [actionButtonBuy] : []),
      ...(!readOnlyModeEnabled && canBeSold ? [actionButtonSell] : []),
      ...(!readOnlyModeEnabled && canStakeUsingPlatformApp && !!StakeAction ? [StakeAction] : []),
      ...(!readOnlyModeEnabled
        ? familySpecificMainActions.filter(
            action => action.id !== "stake" || canOnlyStakeUsingLedgerLive,
          ) // filter out family stake action if we cannot stake using ledger Wallet or if account can be staked with a third-party platform app
        : []),
      ...(!readOnlyModeEnabled ? [SendAction] : []),
      ReceiveAction,
    ],
    [
      availableOnSwap,
      readOnlyModeEnabled,
      canBeBought,
      canBeSold,
      canStakeUsingPlatformApp,
      StakeAction,
      familySpecificMainActions,
      canOnlyStakeUsingLedgerLive,
      actionButtonSwap,
      actionButtonBuy,
      actionButtonSell,
      SendAction,
      ReceiveAction,
    ],
  );

  const familySpecificSecondaryActions = useMemo(
    () =>
      (decorators &&
        decorators.getSecondaryActions &&
        decorators.getSecondaryActions({
          account,
          parentAccount,
          colors,
          parentRoute: route,
        })) ||
      [],
    [decorators, account, parentAccount, colors, route],
  );

  const secondaryActions = useMemo(
    () => [...familySpecificSecondaryActions],
    [familySpecificSecondaryActions],
  );

  return {
    mainActions,
    secondaryActions,
  };
}
