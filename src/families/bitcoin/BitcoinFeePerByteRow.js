/* @flow */
import React, { Component } from "react";
import { View, StyleSheet } from "react-native";
import type { Account } from "@ledgerhq/live-common/lib/types";
import SummaryRow from "../../screens/SendFunds/SummaryRow";
import LText from "../../components/LText";

import colors from "../../colors";
import { getAccountBridge } from "../../bridge";
import type { Transaction } from "../../bridge/RNLibcoreAccountBridge";

type Props = {
  account: Account,
  transaction: Transaction,
  navigation: *,
};

export default class BitcoinFeePerByteRow extends Component<Props> {
  openFees = () => {
    const { account, navigation, transaction } = this.props;
    navigation.navigate("BitcoinEditFeePerByte", {
      accountId: account.id,
      transaction,
    });
  };

  render() {
    const { account, transaction } = this.props;
    const bridge = getAccountBridge(account);
    return (
      <SummaryRow title="Network fees" link="link">
        <View style={{ alignItems: "flex-end" }}>
          <View style={styles.accountContainer}>
            <LText style={styles.valueText}>{`${bridge.getTransactionExtra(
              account,
              transaction,
              "feePerByte",
            )} sat/bytes`}</LText>

            <LText style={styles.link} onPress={this.openFees}>
              Edit
            </LText>
          </View>
        </View>
      </SummaryRow>
    );
  }
}
const styles = StyleSheet.create({
  accountContainer: {
    flex: 1,
    flexDirection: "row",
  },
  summaryRowText: {
    fontSize: 16,
    textAlign: "right",
    color: colors.darkBlue,
  },
  valueText: {
    fontSize: 16,
  },
  link: {
    color: colors.live,
    textDecorationStyle: "solid",
    textDecorationLine: "underline",
    textDecorationColor: colors.live,
    marginLeft: 8,
  },
});
