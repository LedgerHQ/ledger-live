import React from "react";
import BigNumber from "bignumber.js";
import { Flex, Text } from "@ledgerhq/native-ui";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import CounterValue from "~/components/CounterValue";

interface Props {
  currency?: CryptoCurrency | TokenCurrency;
  amount?: BigNumber;
  isLoading?: boolean;
}

export function CurrencyValue({ currency, amount, isLoading }: Props) {
  if (!currency || !amount || isLoading) {
    return (
      <Flex alignItems="flex-end">
        <Text color="neutral.c70">-</Text>
      </Flex>
    );
  }

  return (
    <Flex alignItems="flex-end">
      <Flex paddingBottom={4}>
        <Text variant="tiny" color="neutral.c70">
          <CurrencyUnitValue unit={currency.units[0]} value={amount} />
        </Text>
      </Flex>

      <Flex>
        <Text variant="tiny" color="neutral.c70">
          <CounterValue currency={currency} value={amount} />
        </Text>
      </Flex>
    </Flex>
  );
}
