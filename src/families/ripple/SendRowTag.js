/* @flow */
import React, { PureComponent, Fragment } from "react";
import { View, StyleSheet } from "react-native";
import { translate } from "react-i18next";
import type { Account } from "@ledgerhq/live-common/lib/types";
import { BigNumber } from "bignumber.js";
import type { T } from "../../types/common";
import LText from "../../components/LText";
import { getAccountBridge } from "../../bridge";
import colors from "../../colors";
import SectionSeparator from "../../screens/SendFunds/SectionSeparator";
import SummaryRow from "../../screens/SendFunds/SummaryRow";

type Props = {
  account: Account,
  transaction: *,
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
    const { account, t, transaction } = this.props;
    const bridge = getAccountBridge(account);
    const tag = bridge.getTransactionExtra(account, transaction, "tag");
    return (
      <Fragment>
        {account.currency.family === "ripple" && (
          <View>
            <SummaryRow title={t("send.summary.tag")} info="info">
              <View style={styles.tagContainer}>
                {tag && <LText style={styles.tagText}>{tag.toString()}</LText>}
                <LText style={styles.link} onPress={this.editTag}>
                  {t("common.edit")}
                </LText>
              </View>
            </SummaryRow>
            <SectionSeparator />
          </View>
        )}
      </Fragment>
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
