import React, { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Flex, Text } from "@ledgerhq/native-ui";
import {
  getAccountCurrency,
  getAccountName,
} from "@ledgerhq/live-common/account/index";
import {
  ExchangeRate,
  Pair,
  SwapTransactionType,
} from "@ledgerhq/live-common/exchange/swap/types";
import { useNavigation } from "@react-navigation/native";
import {
  usePickDefaultCurrency,
  useSelectableCurrencies,
} from "@ledgerhq/live-common/exchange/swap/hooks/index";
import {
  CryptoCurrency,
  TokenCurrency,
} from "@ledgerhq/live-common/types/index";
import { swap } from "@ledgerhq/live-common/src/families/solana/utils";
import { useCurrenciesByMarketcap } from "@ledgerhq/live-common/src/currencies";
import { Selector } from "./Selector";
import { CurrencyValue } from "./CurrencyValue";

interface Props {
  swapTx: SwapTransactionType;
  provider?: string;
  exchangeRate?: ExchangeRate;
  pairs: Pair[];
}

export function To({ swapTx, provider, pairs, exchangeRate }: Props) {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();

  const fromCurrency = useMemo(
    () =>
      swapTx.swap.from.account && getAccountCurrency(swapTx.swap.from.account),
    [swapTx.swap.from],
  );

  const rawCurrencies = useCurrencies(pairs, fromCurrency?.id);
  const currencies = useCurrenciesByMarketcap(rawCurrencies);

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

// based toSelector on apps/ledger-live-desktop/src/renderer/actions/swap.js
function useCurrencies(
  pairs: Pair[],
  fromCurrencyId?: string,
): (CryptoCurrency | TokenCurrency)[] {
  const filtered = useMemo(() => {
    if (!pairs) return [];

    if (fromCurrencyId)
      return pairs.reduce<string[]>(
        (acc, pair) => (pair.from === fromCurrencyId ? [...acc, pair.to] : acc),
        [],
      );

    return pairs.map(p => p.to);
  }, [pairs, fromCurrencyId]);

  return useSelectableCurrencies({ allCurrencies: [...new Set(filtered)] });
}
