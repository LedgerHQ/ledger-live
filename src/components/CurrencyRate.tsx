import React from "react";
import { BigNumber } from "bignumber.js";
import {
  CryptoCurrency,
  TokenCurrency,
} from "@ledgerhq/live-common/lib/types/currencies";
import { Text } from "@ledgerhq/native-ui";
import CounterValue from "./CounterValue";
import CurrencyUnitValue from "./CurrencyUnitValue";

type Props = {
  currency: CryptoCurrency | TokenCurrency;
};

export default function CurrencyRate({ currency }: Props) {
  const one = new BigNumber(10 ** currency.units[0].magnitude);

  return (
    <Text
      numberOfLines={1}
      variant={"body"}
      fontWeight={"semiBold"}
      color="neutral.c100"
    >
      <CurrencyUnitValue unit={currency.units[0]} value={one} alwaysShowValue />
      {" = "}
      <CounterValue currency={currency} value={one} alwaysShowValue />
    </Text>
  );
}
