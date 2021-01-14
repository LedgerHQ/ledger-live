/* @flow */
import React, { Component } from "react";
import invariant from "invariant";
import { View, StyleSheet, Linking } from "react-native";
import type { AccountLike, Transaction } from "@ledgerhq/live-common/lib/types";
import { Trans } from "react-i18next";
import SummaryRow from "../../screens/SendFunds/SummaryRow";
import LText from "../../components/LText";
import { ScreenName } from "../../const";
import ExternalLink from "../../icons/ExternalLink";
import { urls } from "../../config/urls";
import { withTheme } from "../../colors";

type Props = {
  account: AccountLike,
  transaction: Transaction,
  navigation: any,
  colors: *,
};

class BitcoinFeePerByteRow extends Component<Props> {
  openFees = () => {
    const { account, navigation, transaction } = this.props;
    navigation.navigate(ScreenName.BitcoinEditFeePerByte, {
      accountId: account.id,
      transaction,
    });
  };

  extraInfoFees = () => {
    Linking.openURL(urls.feesMoreInfo);
  };

  render() {
    const { account, transaction, colors } = this.props;
    invariant(account.type === "Account", "No SubAccounts should be here.");

    return (
      <SummaryRow
        onPress={this.extraInfoFees}
        event="SummaryBitcoinInfoFees"
        title={<Trans i18nKey="send.fees.title" />}
        additionalInfo={
          <View>
            <ExternalLink size={12} color={colors.grey} />
          </View>
        }
      >
        <View style={{ alignItems: "flex-end" }}>
          <View style={styles.accountContainer}>
            <LText style={styles.valueText} semiBold>
              {`${(transaction.feePerByte || "").toString()} `}
              <Trans i18nKey="common.satPerByte" />
            </LText>

            <LText
              style={[styles.link, { textDecorationColor: colors.live }]}
              color="live"
              onPress={this.openFees}
            >
              <Trans i18nKey="common.edit" />
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
  },
  valueText: {
    fontSize: 16,
  },
  link: {
    textDecorationStyle: "solid",
    textDecorationLine: "underline",

    marginLeft: 8,
  },
});

export default withTheme(BitcoinFeePerByteRow);
