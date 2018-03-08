/* @flow */
import React, { Component } from "react";
import { ScrollView, Text, View, StyleSheet } from "react-native";
import colors from "../colors";
import WhiteButton from "../components/WhiteButton";
import HeaderRightText from "../components/HeaderRightText";

export default class SendFundsPlugDevice extends Component<*> {
  static navigationOptions = {
    title: "Plug your device",
    headerRight: <HeaderRightText>5 of 5</HeaderRightText>
  };
  onConfirm = () => {
    const { topLevelNavigation } = this.props.screenProps;
    topLevelNavigation.goBack();
  };
  render() {
    return (
      <ScrollView style={styles.root}>
        <View style={{ padding: 20 }}>
          <Text>Sign the transaction with the device...etc..</Text>
          <WhiteButton title="Confirm" onPress={this.onConfirm} />
        </View>
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.blue
  }
});
