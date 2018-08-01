/* @flow */
import React, { Component } from "react";
import { ScrollView, StyleSheet } from "react-native";
import type { NavigationScreenProp } from "react-navigation";
import type { Account } from "@ledgerhq/live-common/lib/types";
import HeaderRightClose from "../../components/HeaderRightClose";

class ReceiveFunds extends Component<
  {
    navigation: NavigationScreenProp<*>,
    accounts: Account[]
  },
  *
> {
  static navigationOptions = ({ screenProps }: *) => ({
    title: "Receive Funds",
    headerLeft: <HeaderRightClose navigation={screenProps.topLevelNavigation} />
  });
  render() {
    return (
      <ScrollView
        style={styles.root}
        contentContainerStyle={styles.content}
        bounces={false}
      />
    );
  }
}

export default ReceiveFunds;

const styles = StyleSheet.create({
  root: {
    flex: 1
  },
  content: {
    justifyContent: "center",
    paddingHorizontal: 20
  }
});
