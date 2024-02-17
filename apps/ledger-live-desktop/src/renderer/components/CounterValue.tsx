import { BigNumber } from "bignumber.js";
import React from "react";
import { useSelector } from "react-redux";
import { Currency } from "@ledgerhq/types-cryptoassets";
import { useCalculate } from "@ledgerhq/live-countervalues-react";
import { counterValueCurrencySelector } from "~/renderer/reducers/settings";
import FormattedVal, { OwnProps as FormattedValProps } from "~/renderer/components/FormattedVal";
import ToolTip from "./Tooltip";
import { Trans } from "react-i18next";
import useTheme from "~/renderer/hooks/useTheme";
import { useOnDemandCurrencyCountervalues } from "../actions/deprecated/ondemand-countervalues";

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

  const countervalue = useCalculate({
    from: currency,
    to: counterValueCurrency,
    value,
    disableRounding: true,
    date,
  });
  if (typeof countervalue !== "number") {
    return <NoCountervaluePlaceholder placeholder={placeholder} style={placeholderStyle} />;
  }
  return (
    <>
      {prefix || null}
      <FormattedVal
        {...props}
        val={countervalue}
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
