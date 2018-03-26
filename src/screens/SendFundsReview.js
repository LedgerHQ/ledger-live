/* @flow */
import React, { Component } from "react";
import { ScrollView, Text, StyleSheet } from "react-native";
import colors from "../colors";
import WhiteButton from "../components/WhiteButton";
import HeaderRightText from "../components/HeaderRightText";

export default class SendFundsReview extends Component<*> {
  static navigationOptions = {
    title: "Review and Send",
    headerRight: <HeaderRightText>4 of 5</HeaderRightText>
  };
  confirm = () => {
    const { navigation } = this.props;
    navigation.navigate({
      routeName: "SendFundsPlugDevice",
      params: navigation.state.params,
      key: "sendfundsplugdevice"
    });
  };
  render() {
    const { navigation } = this.props;
    const { params } = navigation.state;
    return (
      <ScrollView style={styles.root}>
        <ScrollView style={styles.body}>
          <Text>Amount {params.amount}</Text>
          <Text>Fee {params.fee}</Text>
          <Text>Addr {params.address}</Text>
          <Text>Account {params.accountId}</Text>
        </ScrollView>
        <WhiteButton
          title={`SEND BTC ${params.amount}`}
          onPress={this.confirm}
        />
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.blue
  },
  body: {
    flex: 1
  }
});
