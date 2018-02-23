/* @flow */
import React, { Component } from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity
} from "react-native";
import ScreenGeneric from "../components/ScreenGeneric";
import colors from "../colors";
import BalanceChartMiniature from "../components/BalanceChartMiniature";
import { genData, genDataNext } from "../mock/balance";
import { listCurrencies, formatCurrencyUnit } from "@ledgerhq/currencies";
import LText from "../components/LText";

const currencies = listCurrencies();

const fakeAccounts = Array(20)
  .fill(null)
  .map((_, i) => ({
    id: i,
    color: [colors.green, colors.red, colors.blue][
      Math.floor(3 * Math.random())
    ],
    data: genData(8, 86400000),
    currency: currencies[Math.floor(currencies.length * Math.random())],
    amount: Math.floor(10000000000 * Math.random() * Math.random()),
    name:
      String.fromCharCode(Math.floor(65 + 26 * Math.random())) +
      Array(Math.floor(4 + 30 * Math.random()))
        .fill("")
        .map((_, j) => String.fromCharCode(Math.floor(65 + 26 * Math.random())))
        .join("")
        .toLowerCase()
  }));

export default class Accounts extends Component<*, *> {
  static navigationOptions = {
    tabBarIcon: ({ tintColor }: *) => (
      <Image
        source={require("../images/accounts.png")}
        style={{ tintColor, width: 32, height: 32 }}
      />
    )
  };
  state: { bitcoinAddress: ?string, expandedMode: boolean } = {
    bitcoinAddress: null,
    expandedMode: false
  };
  renderHeader = () => {
    const { expandedMode } = this.state;
    return (
      <View style={styles.header}>
        <TouchableOpacity onPress={this.toggleExpandedMode}>
          <Image
            source={
              expandedMode
                ? require("../images/accountsmenutoggled.png")
                : require("../images/accountsmenu.png")
            }
            style={{ width: 24, height: 20 }}
          />
        </TouchableOpacity>
        <Text style={styles.headerText}>Accounts</Text>
        <TouchableOpacity onPress={this.goToAddAccount}>
          <Image
            source={require("../images/accountsplus.png")}
            style={{ width: 22, height: 21 }}
          />
        </TouchableOpacity>
      </View>
    );
  };

  toggleExpandedMode = () => {
    this.setState(({ expandedMode }) => ({ expandedMode: !expandedMode }));
  };

  goToAddAccount = () => {
    this.props.screenProps.topLevelNavigation.navigate("AddAccount");
  };

  onGoAccountSettings = () => {
    this.props.screenProps.topLevelNavigation.navigate("AccountSettings", {
      accountId: "42"
    });
  };

  render() {
    const { bitcoinAddress, expandedMode } = this.state;
    // FIXME this is not so clean. we might need to use react-navigation for the expanded mode as well...
    return (
      <View style={styles.root}>
        <ScreenGeneric
          key={String(expandedMode) /* force a redraw */}
          renderHeader={this.renderHeader}
        >
          <ScrollView bounces={false} style={styles.body}>
            {expandedMode ? (
              <View style={styles.expanded}>
                {fakeAccounts.map(a => (
                  <View
                    key={a.id}
                    style={{
                      marginVertical: 6,
                      marginHorizontal: 16,
                      height: 60,
                      padding: 5,
                      borderRadius: 4,
                      backgroundColor: "white",
                      alignItems: "center",
                      flexDirection: "row"
                    }}
                  >
                    <BalanceChartMiniature
                      width={80}
                      height={50}
                      data={a.data}
                      color={a.color}
                      withGradient={false}
                    />
                    <LText
                      numberOfLines={1}
                      style={{
                        marginHorizontal: 10,
                        fontSize: 16,
                        color: a.color,
                        flex: 1
                      }}
                    >
                      {a.name}
                    </LText>
                    <LText
                      bold
                      style={{
                        fontSize: 16
                      }}
                    >
                      {formatCurrencyUnit(a.currency.units[0], a.amount, {
                        showCode: true
                      })}
                    </LText>
                  </View>
                ))}
              </View>
            ) : (
              <View>
                <ScrollView style={styles.carouselCountainer} horizontal>
                  {fakeAccounts.map(a => (
                    <View
                      key={a.id}
                      style={{
                        margin: 20,
                        width: 280,
                        height: 220,
                        padding: 10,
                        backgroundColor: "white",
                        position: "relative"
                      }}
                    >
                      <View
                        style={{
                          flex: 1,
                          flexDirection: "column",
                          justifyContent: "flex-end",
                          alignItems: "center"
                        }}
                      >
                        <LText
                          numberOfLines={1}
                          style={{
                            alignSelf: "flex-start",
                            fontSize: 16,
                            color: a.color
                          }}
                        >
                          {a.name}
                        </LText>
                        <LText
                          bold
                          style={{
                            alignSelf: "flex-start",
                            fontSize: 16,
                            marginVertical: 10
                          }}
                        >
                          {formatCurrencyUnit(a.currency.units[0], a.amount, {
                            showCode: true
                          })}
                        </LText>
                        <View style={{ flex: 1 }} />
                        <BalanceChartMiniature
                          width={240}
                          height={100}
                          data={a.data}
                          color={a.color}
                        />
                      </View>
                      <TouchableOpacity
                        style={{ position: "absolute", top: 10, right: 10 }}
                        onPress={this.onGoAccountSettings}
                      >
                        <Image
                          source={require("../images/accountsettings.png")}
                          style={{ width: 30, height: 30 }}
                        />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
                <View style={{ height: 800 }}>
                  <Text>{bitcoinAddress}</Text>
                </View>
              </View>
            )}
          </ScrollView>
        </ScreenGeneric>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1
  },
  body: {
    flex: 1
  },
  carouselCountainer: {
    height: 300,
    backgroundColor: colors.blue
  },
  expanded: {
    backgroundColor: colors.blue
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    flex: 1
  },
  headerText: {
    color: "white",
    fontSize: 16
  }
});
