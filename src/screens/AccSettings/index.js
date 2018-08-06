// @flow

import React, { Component } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { connect } from "react-redux";
import type { NavigationScreenProp } from "react-navigation";
import { createStructuredSelector } from "reselect";
import type { Account } from "@ledgerhq/live-common/lib/types";
import { accountScreenSelector } from "../../reducers/accounts";
import LText from "../../components/LText";

class AccountSettings extends Component<{
  account: ?Account,
  navigation: NavigationScreenProp<{
    accountId: string,
  }>,
}> {
  static navigationOptions = {
    title: "Account settings",
  };
  render() {
    const { account } = this.props;
    if (!account) return null;
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        <LText>{account.name}</LText>
      </ScrollView>
    );
  }
}

export default connect(
  createStructuredSelector({
    account: accountScreenSelector,
  }),
)(AccountSettings);

const styles = StyleSheet.create({
  container: { flex: 1 },
});
