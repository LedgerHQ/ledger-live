/* @flow */
import React, { Component } from "react";
import {
  ScrollView,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions
} from "react-native";
import Carousel, { Pagination } from "react-native-snap-carousel";
import ScreenGeneric from "../components/ScreenGeneric";
import colors from "../colors";
import BalanceChartMiniature from "../components/BalanceChartMiniature";
import { genData, genDataNext } from "../mock/balance";
import { listCurrencies, formatCurrencyUnit } from "@ledgerhq/currencies";
import LText from "../components/LText";
import WhiteButton from "../components/WhiteButton";

const windowDim = Dimensions.get("window");

const currencies = listCurrencies();

const fakeAccounts = Array(20)
  .fill(null)
  .map((_, i) => ({
    id: String(i),
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
  state: {
    bitcoinAddress: ?string,
    expandedMode: boolean,
    selectedIndex: number
  } = {
    bitcoinAddress: null,
    expandedMode: false,
    selectedIndex: 0
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

  onPressExpandedItem = (selectedIndex: number) => {
    this.setState({ selectedIndex, expandedMode: false });
  };

  onSnapToItem = (selectedIndex: number) => {
    this.setState({ selectedIndex });
  };

  renderItemExpanded = ({ item, index }) => (
    <TouchableOpacity onPress={() => this.onPressExpandedItem(index)}>
      <View
        key={item.id}
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
          data={item.data}
          color={item.color}
          withGradient={false}
        />
        <LText
          numberOfLines={1}
          style={{
            marginHorizontal: 10,
            fontSize: 16,
            color: item.color,
            flex: 1
          }}
        >
          {item.name}
        </LText>
        <LText
          bold
          style={{
            fontSize: 16
          }}
        >
          {formatCurrencyUnit(item.currency.units[0], item.amount, {
            showCode: true
          })}
        </LText>
      </View>
    </TouchableOpacity>
  );

  renderItemFull = ({ item }) => (
    <View
      key={item.id}
      style={{
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
            color: item.color
          }}
        >
          {item.name}
        </LText>
        <LText
          bold
          style={{
            alignSelf: "flex-start",
            fontSize: 16,
            marginVertical: 10
          }}
        >
          {formatCurrencyUnit(item.currency.units[0], item.amount, {
            showCode: true
          })}
        </LText>
        <View style={{ flex: 1 }} />
        <BalanceChartMiniature
          width={240}
          height={100}
          data={item.data}
          color={item.color}
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
  );

  keyExtractor = (item: *) => item.id;

  render() {
    const { bitcoinAddress, expandedMode, selectedIndex } = this.state;

    // FIXME this is not so clean. we might need to use react-navigation for the expanded mode as well...

    return (
      <View style={styles.root}>
        <ScreenGeneric
          key={String(expandedMode) /* force a redraw */}
          renderHeader={this.renderHeader}
        >
          <ScrollView bounces={false} style={styles.body}>
            {expandedMode ? (
              <FlatList
                style={styles.expanded}
                data={fakeAccounts}
                keyExtractor={this.keyExtractor}
                renderItem={this.renderItemExpanded}
              />
            ) : (
              <View>
                <View style={styles.carousel}>
                  <Carousel
                    data={fakeAccounts}
                    keyExtractor={this.keyExtractor}
                    itemWidth={280}
                    itemHeight={220}
                    sliderWidth={windowDim.width}
                    sliderHeight={300}
                    inactiveSlideScale={0.8}
                    onSnapToItem={this.onSnapToItem}
                    firstItem={selectedIndex}
                    renderItem={this.renderItemFull}
                  />
                  <Pagination
                    dotsLength={fakeAccounts.length}
                    activeDotIndex={selectedIndex}
                    dotContainerStyle={{
                      marginHorizontal: 4
                    }}
                    dotStyle={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: "rgba(255, 255, 255, 0.92)"
                    }}
                    inactiveDotOpacity={0.4}
                    inactiveDotScale={0.6}
                  />
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-around",
                      position: "relative",
                      bottom: -20
                    }}
                  >
                    <WhiteButton
                      withShadow
                      containerStyle={{ width: 100 }}
                      title="Send"
                    />
                    <WhiteButton
                      withShadow
                      containerStyle={{ width: 100 }}
                      title="Receive"
                    />
                  </View>
                </View>
                <View style={{ height: 800 }}>
                  <LText>{" # " + selectedIndex}</LText>
                  <LText>{bitcoinAddress}</LText>
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
  carousel: {
    paddingTop: 20,
    paddingBottom: 0,
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
