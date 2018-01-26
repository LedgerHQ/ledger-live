/* @flow */
import React, { Component } from "react";
import {
  ScrollView,
  Text,
  StyleSheet,
  View,
  KeyboardAvoidingView,
  TextInput,
  Image,
  TouchableOpacity
} from "react-native";
import colors from "../colors";
import BlueButton from "../components/BlueButton";
import HeaderRightText from "../components/HeaderRightText";

export default class SendFundsChoseAmount extends Component<*, *> {
  static navigationOptions = {
    title: "Chose amount",
    headerRight: <HeaderRightText>3 of 5</HeaderRightText>
  };
  state = {
    amount: 1.2
  };
  onConfirm = () => {
    const { navigation } = this.props;
    const { amount } = this.state;
    navigation.navigate("SendFundsChoseFee", {
      ...navigation.state.params,
      amount
    });
  };
  render() {
    const { amount } = this.state;
    return (
      <KeyboardAvoidingView
        behavior="padding"
        style={styles.root}
        keyboardVerticalOffset={65}
      >
        <ScrollView style={styles.body}>
          <TextInput
            style={styles.textInput}
            placeholder="1.20"
            keyboardType="numeric"
          />
        </ScrollView>
        <BlueButton title="Confirm amount" onPress={this.onConfirm} />
      </KeyboardAvoidingView>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1
  },
  body: {
    flex: 1,
    padding: 10
  },
  textInput: {
    fontSize: 32
  }
});
