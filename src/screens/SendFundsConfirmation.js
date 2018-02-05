/* @flow */
import React, { Component } from "react";
import { NavigationActions } from "react-navigation";
import { View, Text, StyleSheet } from "react-native";
import colors from "../colors";
import WhiteButton from "../components/WhiteButton";

export default class SendFundsConfirmation extends Component<*> {
  static navigationOptions = {
    header: null
  };
  onDone = () => {
    const { navigation } = this.props;
    const action = NavigationActions.reset({
      index: 0,
      actions: [NavigationActions.navigate({ routeName: "Main" })]
    });
    navigation.dispatch(action);
  };
  render() {
    return (
      <View style={styles.root}>
        <Text style={styles.title}>Funds sent successfully !</Text>
        <Text style={styles.subtitle}>Funds sent successfully !</Text>
        <WhiteButton title="Go back to wallet" onPress={this.onDone} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.blue,
    padding: 20
  },
  title: {
    color: "white"
  },
  subtitle: {
    color: "white",
    opacity: 0.5
  }
});
