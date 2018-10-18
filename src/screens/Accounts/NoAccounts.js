// @flow

import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";
import EmptyStatePortfolio from "../Portfolio/EmptyStatePortfolio";
import colors from "../../colors";

class NoAccounts extends PureComponent<{ navigation: * }> {
  render() {
    return (
      <View style={styles.root}>
        <EmptyStatePortfolio navigation={this.props.navigation} />
      </View>
    );
  }
}

export default NoAccounts;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.lightGrey,
  },
});
