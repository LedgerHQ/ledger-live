import invariant from "invariant";
import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";
import { Trans } from "react-i18next";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import { getGasLimit } from "@ledgerhq/live-common/families/ethereum/transaction";
import SummaryRow from "./SummaryRow";
import LText from "../../components/LText";
import { withTheme } from "../../colors";

type Props = {
  transaction: Transaction;
};

class GasLimitSection extends PureComponent<Props, State> {
  render() {
    const { transaction } = this.props;
    invariant(
      transaction.family === "ethereum",
      "SendSummaryScreen: ethereum family expected",
    );
    const gasLimit = getGasLimit(transaction);

    return (
      <>
        <SummaryRow
          title={<Trans i18nKey="send.summary.gasLimit" />}
          titleProps={{
            semiBold: true,
          }}
        >
          <View style={styles.summary}>
            <LText semiBold style={styles.summaryValueText}>
              {gasLimit.toString()}
            </LText>
          </View>
        </SummaryRow>
      </>
    );
  }
}

const styles = StyleSheet.create({
  summary: {
    flex: 1,
    flexDirection: "column",
    alignItems: "flex-end",
  },
  summaryValueText: {
    fontSize: 18,
  },
});
export default withTheme(GasLimitSection);
