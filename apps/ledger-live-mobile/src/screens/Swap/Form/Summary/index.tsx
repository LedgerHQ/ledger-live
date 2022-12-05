import React, { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { BigNumber } from "bignumber.js";
import { Flex, Icon, Text } from "@ledgerhq/native-ui";
import { getProviderName } from "@ledgerhq/live-common/exchange/swap/utils/index";
import { SwapTransactionType } from "@ledgerhq/live-common/exchange/swap/types";
import {
  getAccountName,
  getAccountUnit,
  getMainAccount,
} from "@ledgerhq/live-common/account/index";
import {
  CompositeScreenProps,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import { useSelector } from "react-redux";
import { useCalculate } from "@ledgerhq/live-common/countervalues/react";
import CurrencyUnitValue from "../../../../components/CurrencyUnitValue";
import { providerIcons } from "../../../../icons/swap/index";
import { StatusTag } from "./StatusTag";
import { Item } from "./Item";
import { Banner } from "../Banner";
import { NavigatorName, ScreenName } from "../../../../const";
import CurrencyIcon from "../../../../components/CurrencyIcon";
import { rateExpirationSelector, rateSelector } from "../../../../actions/swap";
import { CountdownTimer } from "./CountdownTimer";
import { counterValueCurrencySelector } from "../../../../reducers/settings";
import {
  BaseComposite,
  MaterialTopTabNavigatorProps,
  StackNavigatorProps,
} from "../../../../components/RootNavigator/types/helpers";
import type { SwapNavigatorParamList } from "../../../../components/RootNavigator/types/SwapNavigator";
import type { SwapFormNavigatorParamList } from "../../../../components/RootNavigator/types/SwapFormNavigator";

interface Props {
  provider?: string;
  swapTx: SwapTransactionType;
  kyc?: string;
}

type Navigation = CompositeScreenProps<
  StackNavigatorProps<SwapNavigatorParamList, ScreenName.SwapSelectFees>,
  BaseComposite<MaterialTopTabNavigatorProps<SwapFormNavigatorParamList>>
>;

export function Summary({
  provider,
  swapTx: { swap, status, transaction },
  kyc,
}: Props) {
  const navigation = useNavigation<Navigation["navigation"]>();
  const route = useRoute<Navigation["route"]>();
  const { t } = useTranslation();

  const exchangeRate = useSelector(rateSelector);
  const ratesExpiration = useSelector(rateExpirationSelector);
  const rawCounterValueCurrency = useSelector(counterValueCurrencySelector);

  const name = useMemo(() => provider && getProviderName(provider), [provider]);

  const ProviderIcon = useMemo(
    () => provider && providerIcons[provider.toLowerCase()],
    [provider],
  );

  const { from, to } = swap;

  const estimatedFees = useMemo(() => status?.estimatedFees ?? "", [status]);

  const onEditProvider = useCallback(() => {
    navigation.navigate(ScreenName.SwapSelectProvider, {
      swap,
      provider,
      selectedRate: exchangeRate,
    });
  }, [navigation, swap, provider, exchangeRate]);

  const onAddAccount = useCallback(() => {
    if (!to.currency) return;

    const params = {
      returnToSwap: true,
      onSuccess: () => {
        navigation.navigate(ScreenName.SwapForm, undefined as never);
      },
      analyticsPropertyFlow: "swap",
    };

    if (to.currency.type === "TokenCurrency") {
      navigation.navigate(NavigatorName.AddAccounts, {
        screen: ScreenName.AddAccountsTokenCurrencyDisclaimer,
        params: {
          ...params,
          token: to.currency,
        },
      });
    } else {
      navigation.navigate(NavigatorName.AddAccounts, {
        screen: ScreenName.AddAccountsSelectDevice,
        params: {
          ...params,
          currency: to.currency,
        },
      });
    }
  }, [navigation, to]);

  const counterValueCurrency = to.currency || rawCounterValueCurrency;
  const effectiveUnit = from.currency?.units[0];
  const valueNum = effectiveUnit && 10 ** effectiveUnit.magnitude;
  const rawCounterValue = useCalculate({
    from: from.currency!,
    to: counterValueCurrency,
    value: valueNum!,
    disableRounding: true,
  });

  const counterValue = useMemo(() => {
    const rate = exchangeRate?.magnitudeAwareRate;
    const valueNum = 10 ** effectiveUnit!.magnitude;
    return rate
      ? rate.times(valueNum) // NB Allow to override the rate for swap
      : typeof rawCounterValue === "number"
      ? new BigNumber(rawCounterValue)
      : rawCounterValue;
  }, [effectiveUnit, exchangeRate?.magnitudeAwareRate, rawCounterValue]);

  const fromUnit = from.currency?.units[0];
  const mainFromAccount =
    from.account && getMainAccount(from.account, from.parentAccount);
  const mainAccountUnit = mainFromAccount && getAccountUnit(mainFromAccount);

  if (
    !provider ||
    !fromUnit ||
    !mainAccountUnit ||
    !to.currency ||
    !estimatedFees ||
    !ProviderIcon ||
    !exchangeRate
  ) {
    return null;
  }

  return (
    <Flex>
      <Item
        title={t("transfer.swap2.form.details.label.provider")}
        onEdit={onEditProvider}
      >
        <Flex flexDirection="row" alignItems="center">
          <StatusTag kyc={kyc} />
          <Flex paddingRight={2}>
            <ProviderIcon size={14} />
          </Flex>

          <Text>{name}</Text>
        </Flex>
      </Item>

      <Item title={t("transfer.swap2.form.details.label.rate")}>
        {ratesExpiration &&
          exchangeRate.tradeMethod === "fixed" &&
          ratesExpiration.getTime() > Date.now() && (
            <Flex paddingX={2}>
              <CountdownTimer
                end={ratesExpiration}
                callback={swap.refetchRates}
              />
            </Flex>
          )}
        <Icon
          name={exchangeRate.tradeMethod === "fixed" ? "Lock" : "Unlock"}
          color="neutral.c70"
        />
        <Text marginLeft={2}>
          <CurrencyUnitValue
            value={new BigNumber(10).pow(fromUnit.magnitude)}
            unit={fromUnit}
            showCode
          />
          {" = "}
          <CurrencyUnitValue
            unit={to.currency.units[0]}
            value={counterValue}
            showCode
          />
        </Text>
      </Item>

      <Item
        title={t("transfer.swap2.form.details.label.fees")}
        onEdit={() =>
          navigation.navigate(ScreenName.SwapSelectFees, {
            ...route.params,
            transaction,
            swap,
          })
        }
      >
        <Text>
          <CurrencyUnitValue unit={mainAccountUnit} value={estimatedFees} />
        </Text>
      </Item>

      {to.account ? (
        <Item
          title={t("transfer.swap2.form.details.label.target")}
          onEdit={() => {
            const selectableCurrencyIds =
              to.currency?.type === "TokenCurrency"
                ? [to.currency.id, to.currency.parentCurrency.id]
                : [to.currency?.id as string];
            navigation.navigate(ScreenName.SwapSelectAccount, {
              target: "to",
              selectedCurrency: to.currency!,
              selectableCurrencyIds,
              swap,
            });
          }}
        >
          <Flex flexDirection="row" alignItems="center">
            {<CurrencyIcon size={20} currency={to.currency} />}
            <Text marginLeft={2}>{getAccountName(to.account)}</Text>
          </Flex>
        </Item>
      ) : (
        <Banner
          message={t("transfer.swap2.form.details.noAccount", to.currency.name)}
          cta={t("transfer.swap2.form.details.noAccountCTA")}
          onPress={onAddAccount}
        />
      )}
    </Flex>
  );
}
