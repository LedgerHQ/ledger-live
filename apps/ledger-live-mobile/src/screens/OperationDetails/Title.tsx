import React, { memo } from "react";
import { StyleProp, ViewStyle, TextStyle } from "react-native";
import { useTheme } from "@react-navigation/native";
import type { Operation } from "@ledgerhq/types-live";
import type { Currency, Unit } from "@ledgerhq/types-cryptoassets";
import type { BigNumber } from "bignumber.js";

import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import DoubleCounterValue from "~/components/DoubleCountervalue";

import LText from "~/components/LText";

type Props = {
  hasFailed: boolean;
  isConfirmed: boolean;
  amount: BigNumber;
  operation: Operation;
  currency: Currency;
  unit: Unit;
  styles: Record<string, StyleProp<ViewStyle | TextStyle>>;
};

const Title = ({ operation, hasFailed, isConfirmed, amount, currency, unit, styles }: Props) => {
  const { colors } = useTheme();
  const isNegative = amount.isNegative();
  const valueColor = isNegative ? colors.smoke : isConfirmed ? colors.green : colors.warning;

  if (hasFailed || amount.isZero()) {
    return null;
  }

  return (
    <>
      <LText
        semiBold
        numberOfLines={1}
        style={[
          styles.currencyUnitValue,
          {
            color: valueColor,
          },
        ]}
        testID="operationDetails-amount"
      >
        <CurrencyUnitValue
          showCode
          disableRounding={true}
          unit={unit}
          value={amount}
          alwaysShowSign
        />
      </LText>
      <DoubleCounterValue
        showCode
        alwaysShowSign
        currency={currency}
        value={amount}
        date={operation.date}
        subMagnitude={1}
      />
    </>
  );
};

export default memo(Title);
