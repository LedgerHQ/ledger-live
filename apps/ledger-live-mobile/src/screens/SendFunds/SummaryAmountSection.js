/* @flow */
import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";
import { Trans } from "react-i18next";
import type { Account, AccountLike } from "@ledgerhq/live-common/lib/types";
import {
  getAccountUnit,
  getAccountCurrency,
} from "@ledgerhq/live-common/lib/account/helpers";
import SummaryRow from "./SummaryRow";
import CurrencyUnitValue from "../../components/CurrencyUnitValue";
import CounterValue from "../../components/CounterValue";
import LText from "../../components/LText";

type Props = {
  account: AccountLike,
  parentAccount: ?Account,
  amount: *,
  overrideAmountLabel?: string,
};
export default class SummaryAmountSection extends PureComponent<Props> {
  render() {
    const { account, amount, overrideAmountLabel } = this.props;
    const unit = getAccountUnit(account);
    const currency = getAccountCurrency(account);
    return (
      <SummaryRow title={<Trans i18nKey="send.summary.amount" />}>
        <View style={styles.amountContainer}>
          {overrideAmountLabel ? (
            <LText style={styles.valueText} semiBold>
              {overrideAmountLabel}
            </LText>
          ) : (
            <>
              <LText style={styles.valueText} semiBold>
                <CurrencyUnitValue unit={unit} value={amount} disableRounding />
              </LText>
              <LText style={styles.counterValueText} color="grey" semiBold>
                <CounterValue
                  before="≈ "
                  value={amount}
                  currency={currency}
                  showCode
                />
              </LText>
            </>
          )}
        </View>
      </SummaryRow>
    );
  }
}
const styles = StyleSheet.create({
  amountContainer: {
    flexDirection: "column",
    alignItems: "flex-end",
  },
  valueText: {
    fontSize: 16,
  },
  counterValueText: {
    fontSize: 12,
  },
});
