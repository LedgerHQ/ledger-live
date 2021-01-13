// @flow

import React from "react";
import { StyleSheet, View } from "react-native";
import { Trans } from "react-i18next";
import type { Portfolio, Currency } from "@ledgerhq/live-common/lib/types";
import LText from "../../components/LText";
import Space from "../../components/Space";
import CurrencyUnitValue from "../../components/CurrencyUnitValue";

type Props = {
  portfolio: Portfolio,
  counterValueCurrency: Currency,
  style?: any,
};

export default function BalanceHeader({
  portfolio,
  counterValueCurrency,
  style,
}: Props) {
  return (
    <View style={[styles.content, style]}>
      <LText secondary color="grey" semiBold style={styles.labelText}>
        <Trans i18nKey="portfolio.totalBalance" />
      </LText>
      <Space h={5} />
      <LText semiBold style={styles.balanceText}>
        <CurrencyUnitValue
          unit={counterValueCurrency.units[0]}
          value={
            portfolio.balanceHistory[portfolio.balanceHistory.length - 1].value
          }
        />
      </LText>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  labelText: {
    fontSize: 14,
  },
  balanceText: {
    fontSize: 16,
  },
});
