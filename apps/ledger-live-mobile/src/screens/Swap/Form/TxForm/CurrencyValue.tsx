import React from "react";
import BigNumber from "bignumber.js";
import { Flex, Text } from "@ledgerhq/native-ui";
import {
  Unit,
  CryptoCurrency,
  TokenCurrency,
} from "@ledgerhq/live-common/lib/types";
import CurrencyUnitValue from "../../../components/CurrencyUnitValue";
import CounterValue from "../../../components/CounterValue";

interface Props {
  currency?: CryptoCurrency | TokenCurrency;
  amount?: BigNumber;
}

export function CurrencyValue({ currency, amount }: Props) {
  if (!currency || !amount) {
    return (
      <Flex alignItems="flex-end">
        <Text>0</Text>
      </Flex>
    );
  }

  return (
    <Flex alignItems="flex-end">
      <Flex paddingBottom={4}>
        <Text variant="tiny">
          <CurrencyUnitValue unit={currency.units[0]} value={amount} />
        </Text>
      </Flex>

      <Flex>
        <Text variant="tiny">
          <CounterValue currency={currency} value={amount} />
        </Text>
      </Flex>
    </Flex>
  );
}
