/* @flow */
import React, { Component } from "react";
import { ScrollView } from "react-native";
import type { NavigationScreenProp } from "react-navigation";

class Settings extends Component<{
  navigation: NavigationScreenProp<*>,
}> {
  static navigationOptions = {
    title: "Manager",
  };

  render() {
    return <ScrollView contentContainerStyle={{ paddingBottom: 40 }} />;
  }
}

export default Settings;
