// @flow
import React from "react";
import { BigNumber } from "bignumber.js";
import { useSelector } from "react-redux";
import type { Currency } from "@ledgerhq/live-common/lib/types";
import { useCalculate } from "@ledgerhq/live-common/lib/countervalues/react";
import { counterValueCurrencySelector } from "../reducers/settings";
import CurrencyUnitValue from "./CurrencyUnitValue";
import LText from "./LText";

type Props = {
  // wich market to query
  currency: Currency,
  // when? if not given: take latest
  date?: Date,
  value: BigNumber,
  // display grey placeholder if no value
  withPlaceholder?: boolean,
  placeholderProps?: mixed,
  // as we can't render View inside Text, provide ability to pass
  // wrapper component from outside
  Wrapper?: React$ComponentType<*>,
  subMagnitude?: number,
};

export default function CounterValue({
  value,
  date,
  withPlaceholder,
  placeholderProps,
  Wrapper,
  currency,
  ...props
}: Props) {
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const countervalue = useCalculate({
    from: currency,
    to: counterValueCurrency,
    value: value.toNumber(),
    disableRounding: true,
    date,
  });

  if (typeof countervalue !== "number") {
    return withPlaceholder ? <LText style={{ fontSize: 16 }}>-</LText> : null;
  }

  const inner = (
    <CurrencyUnitValue
      {...props}
      currency={currency}
      unit={counterValueCurrency.units[0]}
      value={BigNumber(countervalue)}
    />
  );

  if (Wrapper) {
    return <Wrapper>{inner}</Wrapper>;
  }

  return inner;
}
