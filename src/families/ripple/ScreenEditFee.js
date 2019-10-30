// @flow
import React, { Component } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-navigation";
import { connect } from "react-redux";
import i18next from "i18next";
import { createStructuredSelector } from "reselect";
import type { NavigationScreenProp } from "react-navigation";
import type { Account } from "@ledgerhq/live-common/lib/types";
import type { Transaction } from "@ledgerhq/live-common/lib/families/ripple/types";

import colors from "../../colors";
import { accountScreenSelector } from "../../reducers/accounts";
import type { T } from "../../types/common";

import KeyboardView from "../../components/KeyboardView";
import EditFeeUnit from "../EditFeeUnit";

const forceInset = { bottom: "always" };

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
    headerLeft: null,
  };

  render() {
    const { navigation, account } = this.props;
    const transaction: Transaction = navigation.getParam("transaction");
    if (!transaction) return null;
    return (
      <SafeAreaView style={styles.root} forceInset={forceInset}>
        <KeyboardView style={styles.container}>
          <EditFeeUnit
            account={account}
            transaction={transaction}
            navigation={navigation}
            field="fee"
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
