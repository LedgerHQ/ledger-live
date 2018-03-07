/* @flow */
import React, { Component } from "react";
import { ScrollView, View, StyleSheet } from "react-native";
import BlueButton from "../components/BlueButton";

// TODO improve and reuse Settings components
export default class AccountSettings extends Component<*> {
  static navigationOptions = {
    title: "Account settings"
  };
  onConfirm = () => {
    this.props.navigation.goBack();
  };
  render() {
    return (
      <View style={styles.root}>
        <ScrollView style={styles.container} />
        <BlueButton onPress={this.onConfirm} title="Confirm" />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1
  },
  container: { flex: 1 }
});
