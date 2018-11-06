// @flow
import React, { Component } from "react";
import { SafeAreaView, StyleSheet } from "react-native";
import { connect } from "react-redux";
import i18next from "i18next";
import { createStructuredSelector } from "reselect";
import type { NavigationScreenProp } from "react-navigation";
import type { Account } from "@ledgerhq/live-common/lib/types";

import colors from "../../colors";
import { accountScreenSelector } from "../../reducers/accounts";
import type { Transaction } from "../../bridge/RippleJSBridge";
import type { T } from "../../types/common";

import KeyboardView from "../../components/KeyboardView";
import EditFeeUnit from "../EditFeeUnit";

type Props = {
  account: Account,
  navigation: NavigationScreenProp<{
    params: {
      accountId: string,
      transaction: Transaction,
    },
  }>,
  t: T,
};

class RippleEditFee extends Component<Props> {
  static navigationOptions = {
    title: i18next.t("send.fees.title"),
  };

  render() {
    const { navigation, account } = this.props;
    const transaction: Transaction = navigation.getParam("transaction");
    if (!transaction) return null;
    return (
      <SafeAreaView style={styles.root}>
        <KeyboardView style={styles.container}>
          <EditFeeUnit
            account={account}
            transaction={transaction}
            navigation={navigation}
          />
        </KeyboardView>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
  container: {
    flex: 1,
  },
});

const mapStateToProps = createStructuredSelector({
  account: accountScreenSelector,
});

export default connect(mapStateToProps)(RippleEditFee);
