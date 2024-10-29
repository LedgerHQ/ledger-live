import React, { useCallback, useMemo } from "react";
import { useNavigation } from "@react-navigation/core";
import { StackNavigationProp } from "@react-navigation/stack";
import { useSelector } from "react-redux";
import { Trans, useTranslation } from "react-i18next";
import { Alert, Box, Flex, Text } from "@ledgerhq/native-ui";
import { useSettings, useAccountUnit } from "~/hooks";
import { NavigatorName, ScreenName } from "~/const";
import { track } from "~/analytics";
import { shallowAccountsSelector } from "~/reducers/accounts";
import { useFetchCurrencyAll } from "@ledgerhq/live-common/exchange/swap/hooks/index";
import { useRampCatalog } from "@ledgerhq/live-common/platform/providers/RampCatalogProvider/useRampCatalog";
import { getAccountCurrency, getParentAccount } from "@ledgerhq/live-common/account/index";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { AccountLike } from "@ledgerhq/types-live";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { EntryOf } from "~/types/helpers";

type Props = {
  account: AccountLike;
};

type Navigation = StackNavigationProp<BaseNavigatorStackParamList>;
type Route = EntryOf<BaseNavigatorStackParamList>;

const NotEnoughFundFeesAlert: React.FC<Props> = ({ account }) => {
  const { t } = useTranslation();
  const { locale } = useSettings();
  const navigation = useNavigation<Navigation>();
  const accounts = useSelector(shallowAccountsSelector);

  const unit = useAccountUnit(account);
  const { data: swapAvailableIds } = useFetchCurrencyAll();
  const { isCurrencyAvailable: isCurrencyBuyable } = useRampCatalog();

  const parentAccount = getParentAccount(account, accounts);
  const currency = getAccountCurrency(account);

  const canBeSwapped = !!currency && swapAvailableIds.includes(currency.id);
  const canBeBought = !!currency && isCurrencyBuyable(currency.id, "onRamp");

  const assetName = unit.code;
  const currentBalance = formatCurrencyUnit(unit, account.spendableBalance, {
    showCode: true,
    locale: locale,
  });

  const routeToButtonLabel: Record<string, string> = useMemo(
    () => ({
      [NavigatorName.Exchange]: "buy",
      [NavigatorName.Swap]: "swap",
      [NavigatorName.ReceiveFunds]: "deposit",
    }),
    [],
  );

  const onNavigate = useCallback(
    (route: Route) => {
      track("button_clicked", {
        button: routeToButtonLabel[route[0]],
        asset: currency.name,
        source: "UndelegateFlowScreen",
      });
      navigation.navigate<keyof BaseNavigatorStackParamList>(...route);
    },
    [currency.name, navigation, routeToButtonLabel],
  );

  const renderLink = useCallback(
    (route: Route) => (
      <Text
        variant="bodyLineHeight"
        fontWeight="bold"
        style={{ textDecorationLine: "underline" }}
        fontSize={14}
        onPress={() => onNavigate(route)}
      />
    ),
    [onNavigate],
  );

  const ctasSupported = useMemo(() => {
    const ctas = [];
    if (canBeBought) {
      ctas.push({
        label: t("errors.NotEnoughBalanceForUnstaking.ctas.buy"),
        component: renderLink([
          NavigatorName.Exchange,
          {
            screen: ScreenName.ExchangeBuy,
            params: {
              defaultCurrencyId: currency.id,
              defaultAccountId: account.id,
            },
          },
        ]),
      });
    }
    if (canBeSwapped) {
      ctas.push({
        label: t("errors.NotEnoughBalanceForUnstaking.ctas.swap"),
        component: renderLink([
          NavigatorName.Swap,
          {
            screen: ScreenName.SwapTab,
            params: {
              currency,
              accountId: account.id,
            },
          },
        ]),
      });
    }
    ctas.push({
      label: t("errors.NotEnoughBalanceForUnstaking.ctas.deposit"),
      component: renderLink([
        NavigatorName.ReceiveFunds,
        {
          screen: ScreenName.ReceiveConfirmation,
          params: {
            accountId: account.id,
            parentId: parentAccount.id,
            currency,
          },
        },
      ]),
    });
    return ctas;
  }, [account.id, canBeBought, canBeSwapped, currency, parentAccount.id, renderLink, t]);

  const ctasKey =
    ctasSupported.length === 3
      ? "errors.NotEnoughBalanceForUnstaking.threeCtas"
      : ctasSupported.length === 2
        ? "errors.NotEnoughBalanceForUnstaking.twoCtas"
        : "errors.NotEnoughBalanceForUnstaking.oneCta";

  return (
    <Box pb={4}>
      <Alert type="error">
        <Flex flex={1} flexDirection={"column"}>
          <Text textBreakStrategy="balanced" variant="bodyLineHeight" fontSize={14}>
            {t("errors.NotEnoughBalanceForUnstaking.message", {
              currentBalance,
              assetName,
            })}
            <Trans
              i18nKey={ctasKey}
              values={{
                assetName: unit.code,
                cta1Label: ctasSupported[0]?.label,
                cta2Label: ctasSupported[1]?.label,
                cta3Label: ctasSupported[2]?.label,
              }}
              components={{
                ...(ctasSupported[0] && { cta1: ctasSupported[0]?.component }),
                ...(ctasSupported[1] && { cta2: ctasSupported[1]?.component }),
                ...(ctasSupported[2] && { cta3: ctasSupported[2]?.component }),
              }}
            />
          </Text>
        </Flex>
      </Alert>
    </Box>
  );
};

export default NotEnoughFundFeesAlert;
