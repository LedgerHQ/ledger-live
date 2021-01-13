// @flow
import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { BigNumber } from "bignumber.js";
import type {
  CryptoCurrency,
  TokenCurrency,
} from "@ledgerhq/live-common/lib/types/currencies";
import { getCurrencyColor } from "@ledgerhq/live-common/lib/currencies";

import { useTheme } from "@react-navigation/native";
import LText from "../../components/LText";
import CurrencyUnitValue from "../../components/CurrencyUnitValue";
import ProgressBar from "../../components/ProgressBar";
import CounterValue from "../../components/CounterValue";
import CurrencyRate from "../../components/CurrencyRate";
import ParentCurrencyIcon from "../../components/ParentCurrencyIcon";
import { ensureContrast } from "../../colors";

export type DistributionItem = {
  currency: CryptoCurrency | TokenCurrency,
  distribution: number, // % of the total (normalized in 0-1)
  amount: BigNumber,
  countervalue: BigNumber, // countervalue of the amount that was calculated based of the rate provided
};

type Props = {
  item: DistributionItem,
  highlighting: boolean,
};

export default function DistributionCard({
  item: { currency, amount, distribution },
  highlighting = false,
}: Props) {
  const { colors } = useTheme();
  const color = useMemo(
    () => ensureContrast(getCurrencyColor(currency), colors.background),
    [colors, currency],
  );
  const percentage = Math.round(distribution * 1e4) / 1e2;

  return (
    <View
      style={[
        styles.root,
        { backgroundColor: colors.card, borderColor: colors.background },
        highlighting ? { borderColor: color } : {},
      ]}
    >
      <View style={styles.currencyLogo}>
        <ParentCurrencyIcon currency={currency} size={18} />
      </View>
      <View style={styles.rightContainer}>
        <View style={styles.currencyRow}>
          <LText semiBold style={styles.darkBlue}>
            {currency.name}
          </LText>
          <LText semiBold style={styles.darkBlue}>
            {
              <CurrencyUnitValue
                unit={currency.units[0]}
                value={amount}
                joinFragmentsSeparator=" "
              />
            }
          </LText>
        </View>
        {distribution ? (
          <>
            <View style={styles.rateRow}>
              <CurrencyRate currency={currency} />
              <LText semiBold style={styles.counterValue} color="grey">
                <CounterValue
                  currency={currency}
                  value={amount}
                  joinFragmentsSeparator=" "
                />
              </LText>
            </View>
            <View style={styles.distributionRow}>
              <ProgressBar progress={percentage} progressColor={color} />
              <LText
                semiBold
                style={styles.percentage}
                color="smoke"
              >{`${percentage}%`}</LText>
            </View>
          </>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    borderRadius: 4,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 7,
    borderWidth: 1,
  },
  rightContainer: {
    flexGrow: 1,
    flexShrink: 1,
    flexDirection: "column",
  },
  currencyLogo: {
    marginRight: 16,
    alignSelf: "flex-start",
    marginTop: 8,
  },
  currencyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  darkBlue: {
    fontSize: 14,
    lineHeight: 21,
  },
  rateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  distributionRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  counterValue: {
    fontSize: 12,
    lineHeight: 18,
  },
  percentage: {
    width: 45,
    marginLeft: 10,
    textAlign: "right",
    fontSize: 12,
    lineHeight: 18,
  },
  barValue: {},
});
