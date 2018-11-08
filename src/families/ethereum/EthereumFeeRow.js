/* @flow */
import React, { Component, Fragment } from "react";
import { View, StyleSheet, Linking } from "react-native";
import type { Account } from "@ledgerhq/live-common/lib/types";
import { translate } from "react-i18next";
import SummaryRow from "../../screens/SendFunds/SummaryRow";
import LText from "../../components/LText";
import CurrencyUnitValue from "../../components/CurrencyUnitValue";
import CounterValue from "../../components/CounterValue";
import Touchable from "../../components/Touchable";
import EthereumGasLimit from "./SendRowGasLimit";
import ExternalLink from "../../icons/ExternalLink";
import { urls } from "../../config/urls";

import colors from "../../colors";
import { getAccountBridge } from "../../bridge";
import type { T } from "../../types/common";
import type { Transaction } from "../../bridge/EthereumJSBridge";

type Props = {
  account: Account,
  transaction: Transaction,
  navigation: *,
  t: T,
};

class EthereumFeeRow extends Component<Props> {
  openFees = () => {
    const { account, navigation, transaction } = this.props;
    navigation.navigate("EthereumEditFee", {
      accountId: account.id,
      transaction,
    });
  };
  extraInfoFees = () => {
    Linking.openURL(urls.feesMoreInfo).catch(err =>
      console.error("An error occurred", err),
    )
  };

  render() {
    const { account, transaction, t, navigation } = this.props;
    const bridge = getAccountBridge(account);
    const gasPrice = bridge.getTransactionExtra(
      account,
      transaction,
      "gasPrice",
    );
    const feeCustomUnit = bridge.getTransactionExtra(
      account,
      transaction,
      "feeCustomUnit",
    );
    return (
      <Fragment>
        <SummaryRow
          title={t("send.fees.title")}
          additionalInfo={
            <Touchable onPress={this.extraInfoFees}>
              <ExternalLink size={12} color={colors.grey} />
            </Touchable>
          }
        >
          <View style={{ alignItems: "flex-end" }}>
            <View style={styles.accountContainer}>
              {gasPrice ? (
                <LText style={styles.valueText}>
                  <CurrencyUnitValue
                    unit={feeCustomUnit || account.unit}
                    value={gasPrice}
                  />
                </LText>
              ) : null}

              <LText style={styles.link} onPress={this.openFees}>
                {t("common.edit")}
              </LText>
            </View>
            <LText style={styles.countervalue}>
              <CounterValue
                before="("
                value={gasPrice}
                after=")"
                currency={account.currency}
              />
            </LText>
          </View>
        </SummaryRow>
        <EthereumGasLimit
          account={account}
          navigation={navigation}
          transaction={transaction}
        />
      </Fragment>
    );
  }
}

export default translate()(EthereumFeeRow);
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
