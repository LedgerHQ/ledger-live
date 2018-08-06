/* @flow */
import React, { Component } from "react";
import { View, StyleSheet } from "react-native";
import type { NavigationScreenProp } from "react-navigation";
import type { Account } from "@ledgerhq/live-common/lib/types";

import HeaderRightClose from "../../components/HeaderRightClose";

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});

class SendFundsSelectAccount extends Component<{
  accounts: Account[],
  navigation: NavigationScreenProp<{
    params: {},
  }>,
}> {
  static navigationOptions = ({ screenProps }: *) => ({
    title: "Select account",
    headerRight: (
      <HeaderRightClose navigation={screenProps.topLevelNavigation} />
    ),
  });

  render() {
    return <View style={styles.root} />;
  }
}

export default SendFundsSelectAccount;
