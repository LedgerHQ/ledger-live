import React, { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Flex, Text } from "@ledgerhq/native-ui";
import {
  getAccountCurrency,
  getAccountName,
} from "@ledgerhq/live-common/account/index";
import {
  ExchangeRate,
  SwapTransactionType,
} from "@ledgerhq/live-common/exchange/swap/types";
import { useNavigation } from "@react-navigation/native";
import {
  usePickDefaultCurrency,
  useSelectableCurrencies,
} from "@ledgerhq/live-common/exchange/swap/hooks/index";
import { useSelector } from "react-redux";
import { Selector } from "./Selector";
import { CurrencyValue } from "./CurrencyValue";
import { toSelector } from "../../../../actions/swap";

interface Props {
  swapTx: SwapTransactionType;
  provider?: string;
  exchangeRate?: ExchangeRate;
}

export function To({ swapTx, provider, exchangeRate }: Props) {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();

  const fromCurrencyId = useMemo(
    () =>
      swapTx.swap.from.account
        ? getAccountCurrency(swapTx.swap.from.account).id
        : null,
    [swapTx.swap.from],
  );

  const allCurrencies = useSelector(toSelector)(fromCurrencyId);
  const currencies = useSelectableCurrencies({ allCurrencies });

  const { name, balance } = useMemo(() => {
    const to = swapTx.swap.to;
    if (!to) {
      return { name: "", balance: "" };
    }
    return {
      name: (to.account && getAccountName(to.account)) || to.currency?.name,
      balance: to.currency?.units[0].code || "",
    };
  }, [swapTx.swap.to]);

  usePickDefaultCurrency(
    currencies,
    swapTx.swap.to.currency,
    swapTx.setToCurrency,
  );

  const onPress = useCallback(() => {
    navigation.navigate("SelectCurrency", { currencies, provider });
  }, [navigation, currencies, provider]);

  return (
    <Flex>
      <Text>{t("transfer.swap2.form.to")}</Text>
      <Flex flexDirection="row" justifyContent="space-between">
        <Selector
          currency={swapTx.swap.to.currency}
          title={name}
          subTitle={balance || "-"}
          onPress={onPress}
          disabled={!swapTx.swap.to.currency}
        />

        <Flex flex={1} justifyContent="center">
          <CurrencyValue
            currency={swapTx.swap.to.currency}
            amount={exchangeRate?.toAmount}
            isLoading={swapTx.swap.rates.status === "loading"}
          />
        </Flex>
      </Flex>
    </Flex>
  );
}
