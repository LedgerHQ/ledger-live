/* @flow */
import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";
import { translate, Trans } from "react-i18next";
import type { Account } from "@ledgerhq/live-common/lib/types";
import { BigNumber } from "bignumber.js";
import type { Transaction } from "@ledgerhq/live-common/lib/families/stellar/types";
import type { T } from "../../types/common";
import LText from "../../components/LText";
import colors from "../../colors";
import SummaryRow from "../../screens/SendFunds/SummaryRow";

type Props = {
  account: Account,
  transaction: Transaction,
  navigation: *,
  t: T,
};

type State = {
  tag: ?BigNumber,
};
class StellarMemoValueRow extends PureComponent<Props, State> {
  editMemo = () => {
    const { account, navigation, transaction } = this.props;
    navigation.navigate("StellarEditMemoType", {
      account,
      transaction,
    });
  };

  render() {
    const { transaction } = this.props;
    const memoType = transaction.memoType;
    const memoValue = transaction.memoValue;
    return (
      <View>
        <SummaryRow title={"Memo (Optionnal)"} onPress={this.editMemo}>
          <LText style={styles.link} onPress={this.editMemo}>
            <Trans i18nKey="common.edit" />
          </LText>
        </SummaryRow>
        <View style={styles.memo}>
          <LText semiBold style={styles.tagText}>
            {memoType &&
              memoValue &&
              `${memoType.toString()}: ${memoValue.toString()}`}
          </LText>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  memoContainer: {
    flexDirection: "row",
  },
  tagText: {
    fontSize: 14,
    color: colors.darkBlue,
  },
  link: {
    color: colors.live,
    textDecorationStyle: "solid",
    textDecorationLine: "underline",
    textDecorationColor: colors.live,
    marginLeft: 8,
  },
  memo: {
    marginBottom: 10,
  },
});

export default translate()(StellarMemoValueRow);
