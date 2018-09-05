// @flow

import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";
import GenerateMockAccountsButton from "../../components/GenerateMockAccountsButton";
import ImportAccountsButton from "../../components/ImportAccountsButton";

class NoAccounts extends PureComponent<{}> {
  render() {
    return (
      <View style={styles.root}>
        <GenerateMockAccountsButton title="Generate Mock Accounts" />
        <View style={styles.split} />
        {/* $FlowFixMe */}
        <ImportAccountsButton title="Import Accounts" />
      </View>
    );
  }
}

export default NoAccounts;

const styles = StyleSheet.create({
  root: {
    padding: 40,
  },
  split: {
    height: 10,
  },
});
