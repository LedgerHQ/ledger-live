/* @flow */
import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";
import { translate, Trans } from "react-i18next";
import type { Account } from "@ledgerhq/live-common/lib/types";
import { BigNumber } from "bignumber.js";
import type { Transaction } from "@ledgerhq/live-common/lib/families/ripple/types";
import { getAccountBridge } from "@ledgerhq/live-common/lib/bridge";
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
class RippleTagRow extends PureComponent<Props, State> {
  editTag = () => {
    const { account, navigation, transaction } = this.props;
    navigation.navigate("RippleEditTag", {
      accountId: account.id,
      transaction,
    });
  };

  render() {
    const { account, transaction } = this.props;
    const bridge = getAccountBridge(account);
    const tag = bridge.getTransactionExtra(account, transaction, "tag");
    return (
      <View>
        <SummaryRow title={<Trans i18nKey="send.summary.tag" />} info="info">
          <View style={styles.tagContainer}>
            {tag && <LText style={styles.tagText}>{tag.toString()}</LText>}
            <LText style={styles.link} onPress={this.editTag}>
              <Trans i18nKey="common.edit" />
            </LText>
          </View>
        </SummaryRow>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  link: {
    color: colors.live,
    textDecorationStyle: "solid",
    textDecorationLine: "underline",
    textDecorationColor: colors.live,
    marginLeft: 8,
  },
  tagContainer: {
    flexDirection: "row",
  },
  tagText: {
    fontSize: 16,
    color: colors.darkBlue,
  },
});

export default translate()(RippleTagRow);
