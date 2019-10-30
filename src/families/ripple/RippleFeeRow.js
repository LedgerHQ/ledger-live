/* @flow */
import React, { Component } from "react";
import { View, StyleSheet, Linking } from "react-native";
import type { AccountLike } from "@ledgerhq/live-common/lib/types";
import { Trans, translate } from "react-i18next";
import type { Transaction } from "@ledgerhq/live-common/lib/families/ripple/types";
import { getAccountBridge } from "@ledgerhq/live-common/lib/bridge";

import SummaryRow from "../../screens/SendFunds/SummaryRow";
import LText from "../../components/LText";
import CurrencyUnitValue from "../../components/CurrencyUnitValue";
import CounterValue from "../../components/CounterValue";
import ExternalLink from "../../icons/ExternalLink";
import { urls } from "../../config/urls";

import colors from "../../colors";
import type { T } from "../../types/common";

type Props = {
  account: AccountLike,
  transaction: Transaction,
  navigation: *,
  t: T,
};

class RippleFeeRow extends Component<Props> {
  openFees = () => {
    const { account, navigation, transaction } = this.props;
    navigation.navigate("RippleEditFee", {
      accountId: account.id,
      transaction,
    });
  };
  extraInfoFees = () => {
    Linking.openURL(urls.feesMoreInfo);
  };

  render() {
    const { account, transaction } = this.props;
    if (account.type !== "Account") return null;

    const bridge = getAccountBridge(account);
    const fee = bridge.getTransactionExtra(account, transaction, "fee");
    const feeCustomUnit = bridge.getTransactionExtra(
      account,
      transaction,
      "feeCustomUnit",
    );
    return (
      <SummaryRow
        onPress={this.extraInfoFees}
        title={<Trans i18nKey="send.fees.title" />}
        additionalInfo={
          <View>
            <ExternalLink size={12} color={colors.grey} />
          </View>
        }
      >
        <View style={{ alignItems: "flex-end" }}>
          <View style={styles.accountContainer}>
            {fee ? (
              <LText style={styles.valueText}>
                <CurrencyUnitValue
                  unit={feeCustomUnit || account.unit}
                  value={fee}
                />
              </LText>
            ) : null}

            <LText style={styles.link} onPress={this.openFees}>
              <Trans i18nKey="common.edit" />
            </LText>
          </View>
          <LText style={styles.countervalue}>
            <CounterValue before="≈ " value={fee} currency={account.currency} />
          </LText>
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
  countervalue: {
    fontSize: 12,
    color: colors.grey,
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

export default translate()(RippleFeeRow);
