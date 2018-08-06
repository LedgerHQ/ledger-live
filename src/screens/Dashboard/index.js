/* @flow */
import React, { Component } from "react";
import { Image, View, StyleSheet } from "react-native";

const navigationOptions = {
  tabBarIcon: ({ tintColor }: *) => (
    <Image
      source={require("../../images/dashboard.png")}
      style={{ tintColor, width: 32, height: 32 }}
    />
  ),
};

class Dashboard extends Component<{
  navigation: *,
}> {
  static navigationOptions = navigationOptions;

  render() {
    return <View root={styles.root} />;
  }
}

export default Dashboard;

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
