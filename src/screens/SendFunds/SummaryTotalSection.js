/* @flow */
import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";
import type { Account } from "@ledgerhq/live-common/lib/types";
import { translate } from "react-i18next";
import SummaryRow from "./SummaryRow";
import type { T } from "../../types/common";
import CounterValue from "../../components/CounterValue";
import CurrencyUnitValue from "../../components/CurrencyUnitValue";
import LText from "../../components/LText";

import colors from "../../colors";

type Props = {
  account: Account,
  amount: *,
  t: T,
};
class SummaryToSection extends PureComponent<Props> {
  render() {
    const { account, amount, t } = this.props;
    return (
      <SummaryRow
        title={t("send.summary.total")}
        info="info"
        titleProps={{ bold: true, style: styles.title }}
      >
        <View style={styles.summary}>
          <LText semiBold style={styles.summaryValueText}>
            <CurrencyUnitValue
              disableRounding
              unit={account.unit}
              value={amount}
            />
          </LText>
          <LText style={styles.summaryCounterValueText}>
            (
            <CounterValue value={amount} currency={account.currency} showCode />
            )
          </LText>
        </View>
      </SummaryRow>
    );
  }
}
const styles = StyleSheet.create({
  summary: {
    flex: 1,
    flexDirection: "column",
    alignItems: "flex-end",
  },
  title: {
    color: colors.black,
  },
  summaryValueText: {
    fontSize: 18,
  },
  summaryCounterValueText: {
    fontSize: 14,
    color: colors.grey,
  },
});

export default translate()(SummaryToSection);
