/* @flow */
import React, { Component } from "react";
import { View, StyleSheet } from "react-native";
import type { NavigationScreenProp } from "react-navigation";
import LText from "../../components/LText";

class ManagerAppsList extends Component<{
  navigation: NavigationScreenProp<*>,
}> {
  static navigationOptions = {
    title: "App catalog",
  };

  render() {
    const deviceId = this.props.navigation.getParam("deviceId");
    return (
      <View style={styles.root}>
        <LText bold>{deviceId}</LText>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: 20,
  },
});

export default ManagerAppsList;
