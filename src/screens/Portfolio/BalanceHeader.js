// @flow

import React, { PureComponent } from "react";
import { StyleSheet, View } from "react-native";
import { Trans } from "react-i18next";
import type { Portfolio, Currency } from "@ledgerhq/live-common/lib/types";
import colors from "../../colors";
import LText from "../../components/LText";
import Space from "../../components/Space";
import CurrencyUnitValue from "../../components/CurrencyUnitValue";

class BalanceHeader extends PureComponent<{
  portfolio: Portfolio,
  counterValueCurrency: Currency,
}> {
  render() {
    const { portfolio, counterValueCurrency } = this.props;
    return (
      <View style={styles.content}>
        <LText secondary semiBold style={styles.labelText}>
          <Trans i18nKey="portfolio.totalBalance" />
        </LText>
        <Space h={5} />
        <LText tertiary style={styles.balanceText}>
          <CurrencyUnitValue
            unit={counterValueCurrency.units[0]}
            value={
              portfolio.balanceHistory[portfolio.balanceHistory.length - 1]
                .value
            }
          />
        </LText>
      </View>
    );
  }
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
    color: colors.grey,
  },
  balanceText: {
    fontSize: 16,
    color: colors.darkBlue,
  },
});

export default BalanceHeader;
