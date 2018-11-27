// @flow

import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";
import { connect } from "react-redux";
import { createStructuredSelector } from "reselect";
import type { AsyncState } from "../../reducers/bridgeSync";
import { accountSyncStateSelector } from "../../reducers/bridgeSync";
import { networkErrorSelector } from "../../reducers/appstate";
import HeaderErrorTitle from "../../components/HeaderErrorTitle";

class Header extends PureComponent<{
  syncState: AsyncState,
  networkError: ?Error,
}> {
  render() {
    const {
      syncState: { error },
      networkError,
    } = this.props;
    return error ? (
      <View style={styles.root}>
        <HeaderErrorTitle withDescription error={networkError || error} />
      </View>
    ) : null;
  }
}

export default connect(
  createStructuredSelector({
    syncState: accountSyncStateSelector,
    networkError: networkErrorSelector,
  }),
)(Header);

const styles = StyleSheet.create({
  root: {
    paddingTop: 16,
  },
});
