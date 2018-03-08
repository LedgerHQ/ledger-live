/* @flow */
import React, { Component } from "react";
import { ScrollView, View, StyleSheet } from "react-native";

import HeaderRightClose from "../components/HeaderRightClose";
import BlueButton from "../components/BlueButton";

export default class SendFundsSelectAccount extends Component<*> {
  static navigationOptions = ({ screenProps }: *) => ({
    title: "Select account",
    headerRight: (
      <HeaderRightClose navigation={screenProps.topLevelNavigation} />
    )
  });
  confirmAccount = () => {
    const { navigation } = this.props;
    navigation.navigate("SendFundsScanAddress", {
      ...navigation.state.params,
      accountId: "42"
    });
  };
  render() {
    return (
      <View style={styles.root}>
        <ScrollView style={styles.scroll} />
        <BlueButton onPress={this.confirmAccount} title="Confirm account" />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1
  },
  scroll: {
    flex: 1
  }
});
