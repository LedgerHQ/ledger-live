import { useCalculate } from "@ledgerhq/live-countervalues-react";
import { Currency } from "@ledgerhq/types-cryptoassets";
import { BigNumber } from "bignumber.js";
import React from "react";
import { Trans } from "react-i18next";
import { useSelector } from "react-redux";
import FormattedVal, { OwnProps as FormattedValProps } from "~/renderer/components/FormattedVal";
import useTheme from "~/renderer/hooks/useTheme";
import { counterValueCurrencySelector } from "~/renderer/reducers/settings";
import { useOnDemandCurrencyCountervalues } from "../actions/deprecated/ondemand-countervalues";
import ToolTip from "./Tooltip";

type Props = {
  // wich market to query
  currency: Currency;
  // when? if not given: take latest
  date?: Date;
  value: BigNumber | number;
  alwaysShowSign?: boolean;
  alwaysShowValue?: boolean;
  // overrides discreet mode

  subMagnitude?: number;
  placeholder?: React.ReactNode;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  placeholderStyle?: {
    [key: string]: string | number;
  };
  counterValue?: BigNumber;
} & Partial<FormattedValProps>;

export const NoCountervaluePlaceholder = ({
  placeholder,
  style = {},
}: {
  placeholder?: React.ReactNode;
  style?: React.CSSProperties;
}) => {
  const colors = useTheme().colors;
  return (
    <div
      style={{
        ...style,
        maxHeight: "16px",
      }}
    >
      <ToolTip
        content={<Trans i18nKey="errors.countervaluesUnavailable.title" />}
        containerStyle={{
          color: colors.palette.text.shade40,
        }}
      >
        {placeholder || "-"}
      </ToolTip>
    </div>
  );
};
export default function CounterValue({
  counterValue,
  value: valueProp,
  date,
  currency,
  alwaysShowSign = false,
  alwaysShowValue = false,
  placeholder,
  prefix,
  suffix,
  placeholderStyle,
  ...props
}: Props) {
  const value = valueProp instanceof BigNumber ? valueProp.toNumber() : valueProp;
  const counterValueCurrency = useSelector(counterValueCurrencySelector);

  useOnDemandCurrencyCountervalues(currency, counterValueCurrency);

  const calculatedCounterValue = useCalculate({
    from: currency,
    to: counterValueCurrency,
    value,
    disableRounding: true,
    date,
  });
  if (typeof calculatedCounterValue !== "number") {
    return <NoCountervaluePlaceholder placeholder={placeholder} style={placeholderStyle} />;
  }

  return (
    <>
      {prefix || null}
      <FormattedVal
        {...props}
        val={counterValue || calculatedCounterValue}
        currency={currency}
        unit={counterValueCurrency.units[0]}
        showCode
        alwaysShowSign={alwaysShowSign}
        alwaysShowValue={alwaysShowValue}
      />
      {suffix || null}
    </>
  );
}
