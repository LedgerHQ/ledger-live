// @flow

import React, { Component } from "react";
import { Image, View, StyleSheet, StatusBar } from "react-native";
import LText from "../../components/LText/index";

import DashboardHeader from "./DashboardHeader";

const navigationOptions = {
  tabBarIcon: ({ tintColor }: *) => (
    <Image
      source={require("../../images/dashboard.png")}
      style={{ tintColor, width: 32, height: 32 }}
    />
  ),
};

class Dashboard extends Component<{ navigation: * }> {
  static navigationOptions = navigationOptions;

  // FIXME: remove when operatlist is ready
  renderStuff = () =>
    [...Array(20).keys()].map(i => (
      <View
        key={i}
        style={{ backgroundColor: "#eee", marginVertical: 10, padding: 10 }}
      >
        <LText>{i}</LText>
      </View>
    ));

  render() {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="light-content" />
        <DashboardHeader>
          {this.renderStuff() /* FIXME: remove when operation list is ready */}
        </DashboardHeader>
      </View>
    );
  }
}

export default Dashboard;

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
