// @flow
import React from "react";
import { View, StyleSheet } from "react-native";
import { BigNumber } from "bignumber.js";
import type {
  CryptoCurrency,
  TokenCurrency,
} from "@ledgerhq/live-common/lib/types/currencies";
import { getCurrencyColor } from "@ledgerhq/live-common/lib/currencies";

import colors from "../../colors";
import LText from "../../components/LText";
import CurrencyUnitValue from "../../components/CurrencyUnitValue";
import ProgressBar from "../../components/ProgressBar";
import CounterValue from "../../components/CounterValue";
import CurrencyRate from "../../components/CurrencyRate";
import ParentCurrencyIcon from "../../components/ParentCurrencyIcon";

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
  const color = getCurrencyColor(currency);
  const percentage = (Math.floor(distribution * 10000) / 100).toFixed(2);

  return (
    <View style={[styles.root, highlighting ? { borderColor: color } : {}]}>
      <View style={styles.currencyLogo}>
        <ParentCurrencyIcon currency={currency} size={18} />
      </View>
      <View style={styles.rightContainer}>
        <View style={styles.currencyRow}>
          <LText semiBold style={styles.darkBlue}>
            {currency.name}
          </LText>
          <LText tertiary style={styles.darkBlue}>
            {<CurrencyUnitValue unit={currency.units[0]} value={amount} />}
          </LText>
        </View>
        {distribution ? (
          <>
            <View style={styles.rateRow}>
              <CurrencyRate currency={currency} />
              <LText tertiary style={styles.counterValue}>
                <CounterValue currency={currency} value={amount} />
              </LText>
            </View>
            <View style={styles.distributionRow}>
              <ProgressBar progress={percentage} progressColor={color} />
              <LText
                tertiary
                style={styles.percentage}
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
    backgroundColor: colors.white,
    borderRadius: 4,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 7,
    borderColor: "white",
    borderWidth: 1,
  },
  rightContainer: {
    flexDirection: "column",
    flexGrow: 1,
  },
  currencyLogo: {
    marginRight: 16,
    alignSelf: "flex-start",
    marginTop: 8,
  },
  currencyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  darkBlue: {
    color: colors.darkBlue,
    fontSize: 14,
    lineHeight: 21,
  },
  rateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  distributionRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  counterValue: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.grey,
  },
  percentage: {
    width: 45,
    marginLeft: 10,
    textAlign: "right",
    fontSize: 12,
    lineHeight: 18,
    color: colors.smoke,
  },
  barValue: {},
});
