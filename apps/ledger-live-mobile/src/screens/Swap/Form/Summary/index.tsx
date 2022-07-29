import React, { useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { BigNumber } from "bignumber.js";
import { Flex, Icon, Text } from "@ledgerhq/native-ui";
import { getProviderName } from "@ledgerhq/live-common/exchange/swap/utils/index";
import {
  SwapTransactionType,
  ExchangeRate,
  KYCStatus,
} from "@ledgerhq/live-common/exchange/swap/types";
import {
  getAccountName,
  getAccountUnit,
  getAccountCurrency,
} from "@ledgerhq/live-common/account/index";
import { useNavigation } from "@react-navigation/native";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import CurrencyUnitValue from "../../../../components/CurrencyUnitValue";
import { providerIcons } from "../../../../icons/swap/index";
import { StatusTag } from "./StatusTag";
import { Item } from "./Item";
import { Banner } from "../Banner";
import { NavigatorName, ScreenName } from "../../../../const";
import CurrencyIcon from "../../../../components/CurrencyIcon";

interface Props {
  provider?: string;
  swapTx: SwapTransactionType;
  exchangeRate?: ExchangeRate;
  kyc?: KYCStatus;
}

export function Summary({
  provider,
  swapTx: { swap, status, transaction },
  exchangeRate,
  kyc,
}: Props) {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();

  const name = useMemo(() => provider && getProviderName(provider), [provider]);

  const ProviderIcon = useMemo(
    () => provider && providerIcons[provider.toLowerCase()],
    [provider],
  );

  const { from, to } = swap;

  const fromUnit = useMemo(() => from.account && getAccountUnit(from.account), [
    from.account,
  ]);

  const targetAccountName = useMemo(
    () => to.account && getAccountName(to.account),
    [to.account],
  );

  const targetAccountCurrency: CryptoCurrency | TokenCurrency = useMemo(
    () => to.account && getAccountCurrency(to.account),
    [to.account],
  );

  const fees = useMemo(() => status?.estimatedFees ?? "", [status]);

  const onEditProvider = useCallback(() => {
    navigation.navigate("SelectProvider", {
      swap,
      provider,
      selectedId: exchangeRate?.rateId,
    });
  }, [navigation, swap, provider, exchangeRate]);

  const onAddAccount = useCallback(() => {
    const params = {
      returnToSwap: true,
      onSuccess: () => {
        navigation.pop();
      },
      analyticsPropertyFlow: "swap",
    };

    if (swap.to.currency.type === "TokenCurrency") {
      navigation.navigate(NavigatorName.AddAccounts, {
        screen: ScreenName.AddAccountsTokenCurrencyDisclaimer,
        params: {
          ...params,
          token: swap.to.currency,
        },
      });
    } else {
      navigation.navigate(NavigatorName.AddAccounts, {
        screen: ScreenName.AddAccountsSelectDevice,
        params: {
          ...params,
          currency: swap.to.currency,
        },
      });
    }
  }, [navigation, swap]);

  if (
    !provider ||
    !fromUnit ||
    !to.currency ||
    !fees ||
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
            value={new BigNumber(10)
              .pow(fromUnit.magnitude)
              .times(exchangeRate.magnitudeAwareRate)}
            showCode
          />
        </Text>
      </Item>

      <Item
        title={t("transfer.swap2.form.details.label.fees")}
        onEdit={() => navigation.navigate("SelectFees", { transaction, swap })}
      >
        <Text>
          <CurrencyUnitValue unit={fromUnit} value={fees} />
        </Text>
      </Item>

      {swap.to.account ? (
        <Item
          title={t("transfer.swap2.form.details.label.target")}
          onEdit={() => {
            const selectableCurrencyIds =
              to.currency.type === "TokenCurrency"
                ? [to.currency.id, to.currency.parentCurrency.id]
                : [to.currency.id];
            navigation.navigate("SelectAccount", {
              target: "to",
              selectedCurrency: to.currency,
              selectableCurrencyIds,
              swap,
            });
          }}
        >
          <Flex flexDirection="row" alignItems="center">
            <CurrencyIcon size={20} currency={targetAccountCurrency} />
            <Text marginLeft={2}>{targetAccountName}</Text>
          </Flex>
        </Item>
      ) : (
        <Banner
          message={t("transfer.swap2.form.details.noAccount", to.currency)}
          cta={t("transfer.swap2.form.details.noAccountCTA")}
          onPress={onAddAccount}
        />
      )}
    </Flex>
  );
}
