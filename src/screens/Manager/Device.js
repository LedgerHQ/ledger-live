/* @flow */
import React, { Component } from "react";
import { View, StyleSheet } from "react-native";
import { connect } from "react-redux";
import type { NavigationScreenProp } from "react-navigation";
import { removeKnownDevice } from "../../actions/ble";
import LText from "../../components/LText";

class ManagerDevice extends Component<{
  navigation: NavigationScreenProp<*>,
}> {
  static navigationOptions = {
    title: "Device",
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

export default connect(
  null,
  {
    removeKnownDevice,
  },
)(ManagerDevice);
