/* @flow */
import React, { PureComponent } from "react";
import { connect } from "react-redux";
import type { NavigationScreenProp } from "react-navigation";
import { ScrollView, StyleSheet } from "react-native";
import config from "react-native-config";
import { createStructuredSelector } from "reselect";
import { accountsSelector } from "../../../reducers/accounts";
import GenerateMockAccounts from "./GenerateMockAccounts";
import ImportBridgeStreamData from "./ImportBridgeStreamData";
import OpenDebugBLE from "./OpenDebugBLE";
import BenchmarkQRStream from "./BenchmarkQRStream";

class DebugSettings extends PureComponent<{
  accounts: *,
  navigation: NavigationScreenProp<*>,
}> {
  static navigationOptions = {
    title: "Debug",
  };

  render() {
    const { accounts } = this.props;
    return (
      <ScrollView contentContainerStyle={styles.root}>
        {config.BRIDGESTREAM_DATA ? (
          // $FlowFixMe
          <ImportBridgeStreamData
            title="Import .env BRIDGESTREAM_DATA"
            dataStr={config.BRIDGESTREAM_DATA}
          />
        ) : null}
        {accounts.length === 0 ? (
          <GenerateMockAccounts title="Generate 10 mock Accounts" count={10} />
        ) : null}
        <OpenDebugBLE />
        <BenchmarkQRStream />
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  root: { paddingTop: 16, paddingBottom: 64 },
  container: {
    marginTop: 16,
  },
});

export default connect(
  createStructuredSelector({
    accounts: accountsSelector,
  }),
)(DebugSettings);
