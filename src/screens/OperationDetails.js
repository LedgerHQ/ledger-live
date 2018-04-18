/* @flow */
import React, { Component } from "react";
import moment from "moment";
import { View, StyleSheet, ScrollView, Linking, Image } from "react-native";
import type { NavigationScreenProp } from "react-navigation";
import HeaderRightClose from "../components/HeaderRightClose";
import LText from "../components/LText";
import CurrencyIcon from "../components/CurrencyIcon";
import BlueButton from "../components/BlueButton";
import CurrencyUnitValue from "../components/CurrencyUnitValue";
import CounterValue from "../components/CounterValue";
import Touchable from "../components/Touchable";
import colors from "../colors";

export default class OperationDetails extends Component<{
  navigation: NavigationScreenProp<*>
}> {
  static navigationOptions = ({ navigation }: *) => ({
    title: "Operation Details",
    headerRight: <HeaderRightClose navigation={navigation} />,
    headerLeft: null
  });

  viewOperation = () => {
    const { operation } = this.props.navigation.state.params;
    return Linking.openURL(
      `https://testnet.blockchain.info/tx/${operation.id}`
    );
  };
  viewAccount = () => {
    const { navigation } = this.props;
    /* Fix Me to have an access to the mainNavigation */
    const { mainNavigation } = this.props.navigation.state.params;
    mainNavigation.navigate({
      routeName: "Accounts",
      params: { accountId: navigation.state.params.account.id },
      key: "accounts"
    });
    navigation.goBack();
  };
  render() {
    const {
      operation,
      account,
      linkToAccount
    } = this.props.navigation.state.params;
    const isConfirmed = operation.confirmations >= account.minConfirmations;
    const colorConfirmed = isConfirmed ? colors.green : colors.red;
    const colorTransaction = operation.amount >= 0 ? colors.green : "black";
    return (
      <View style={styles.container}>
        <ScrollView style={styles.body}>
          <View style={styles.row}>
            <View style={styles.transactionAmount}>
              <CurrencyIcon
                style={styles.currencyIcon}
                size={46}
                currency={account.currency}
              />
              <LText
                style={[styles.currencyValue, { color: colorTransaction }]}
              >
                <CurrencyUnitValue
                  unit={account.unit}
                  value={operation.amount}
                />
              </LText>
              <LText style={styles.counterValue}>
                <CounterValue
                  value={operation.amount}
                  date={operation.date}
                  currency={account.currency}
                />
              </LText>
            </View>
          </View>
          <View style={styles.row}>
            <LText style={[styles.operationLabel, styles.colLeft]}>
              Account
            </LText>
            <LText numberOfLines={1} style={styles.colRight}>
              {account.name}
            </LText>
            {linkToAccount ? (
              <Touchable onPress={this.viewAccount}>
                <Image
                  style={styles.viewAccountIcon}
                  source={require("../images/lookUp.png")}
                />
              </Touchable>
            ) : null}
          </View>
          <View style={styles.row}>
            <LText style={[styles.operationLabel, styles.colLeft]}>Date</LText>
            <LText style={styles.colRight}>
              {moment(operation.date).format("MMMM Do YYYY, h:mm:ss a")}
            </LText>
          </View>
          <View style={styles.row}>
            <LText style={[styles.operationLabel, styles.colLeft]}>
              Status
            </LText>
            <LText
              style={{
                color: colorConfirmed,
                flexDirection: "column",
                flex: 4
              }}
            >
              {isConfirmed
                ? `Confirmed (${operation.confirmations})`
                : `Not Confirmed (${operation.confirmations})`}
            </LText>
          </View>
          <View style={styles.row}>
            <LText style={[styles.operationLabel, styles.colLeft]}>From</LText>
            <LText style={styles.colRight}>Coming...</LText>
          </View>
          <View style={styles.row}>
            <LText style={[styles.operationLabel, styles.colLeft]}>To</LText>
            <LText style={styles.colRight}>Coming...</LText>
          </View>
          <View style={styles.row}>
            <LText style={[styles.operationLabel, styles.colLeft]}>
              Identifier
            </LText>
            <LText style={styles.colRight}>{operation.id}</LText>
          </View>
        </ScrollView>
        <BlueButton onPress={this.viewOperation} title="View Operation" />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white"
  },
  body: {
    flex: 1
  },
  row: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    backgroundColor: "white",
    marginBottom: 1
  },
  currencyIcon: {
    margin: 10
  },
  viewAccountIcon: {
    width: 18,
    height: 18,
    opacity: 0.6
  },
  operationLabel: {
    color: "#6c6d6c"
  },
  currencyValue: {
    fontSize: 28
  },
  opRow: {
    flexDirection: "row"
  },
  colLeft: {
    flexDirection: "column",
    flex: 2
  },
  colRight: {
    flexDirection: "column",
    flex: 4
  },
  transactionAmount: {
    flexDirection: "column",
    flex: 1,
    alignItems: "center"
  },
  counterValue: {
    fontSize: 18,
    opacity: 0.5,
    flexDirection: "row",
    flex: 1
  }
});
