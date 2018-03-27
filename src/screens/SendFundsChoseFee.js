/* @flow */
import React, { Component } from "react";
import { View } from "react-native";

import BlueButton from "../components/BlueButton";
import HeaderRightText from "../components/HeaderRightText";

export default class SendFundsChoseFee extends Component<*> {
  static navigationOptions = {
    title: "Fees",
    headerRight: <HeaderRightText>3 of 5</HeaderRightText>
  };
  onConfirm = () => {
    const { navigation } = this.props;
    navigation.navigate(
      "SendFundsReview",
      {
        ...navigation.state.params,
        fee: 0.3
      },
      {
        key: "sendfundreview"
      }
    );
  };
  render() {
    return (
      <View style={{ flex: 1, padding: 20 }}>
        <BlueButton title="mock fee choice" onPress={this.onConfirm} />
      </View>
    );
  }
}
