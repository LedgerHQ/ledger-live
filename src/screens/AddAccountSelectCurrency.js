/* @flow */
import React, { Component } from "react";
import { View, StyleSheet } from "react-native";

import HeaderRightClose from "../components/HeaderRightClose";
import BlueButton from "../components/BlueButton";

export default class AddAccountSelectCurrency extends Component<*> {
  static navigationOptions = ({ screenProps }: *) => ({
    title: "Add an account",
    headerRight: <HeaderRightClose navigation={screenProps.parentNavigation} />
  });
  onSelect = () => {
    const { navigation } = this.props;
    navigation.navigate({
      routeName: "AddAccountInfo",
      params: {
        currency: "bitcoin"
      },
      key: "addaccountinfo"
    });
  };
  render() {
    return (
      <View style={styles.root}>
        <View style={{ flex: 1 }} />
        <BlueButton onPress={this.onSelect} title="Confirm" />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1
  }
});
