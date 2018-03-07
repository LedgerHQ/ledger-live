/* @flow */
import React, { Component, PureComponent } from "react";
import {
  ScrollView,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Image,
  Dimensions
} from "react-native";
import moment from "moment";
import Carousel, { Pagination } from "react-native-snap-carousel";
import ScreenGeneric from "../components/ScreenGeneric";
import colors from "../colors";
import BalanceChartMiniature from "../components/BalanceChartMiniature";
import { genAccount } from "../mock/account";
import { formatCurrencyUnit } from "@ledgerhq/currencies";
import LText from "../components/LText";
import CurrencyUnitValue from "../components/CurrencyUnitValue";
import WhiteButton from "../components/WhiteButton";

const windowDim = Dimensions.get("window");

const fakeAccounts = Array(12)
  .fill(null)
  .map((_, i) => genAccount(i));

class AccountRow extends PureComponent<*, *> {
  render() {
    const { account } = this.props;
    return (
      <View
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
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            marginRight: 10,
            backgroundColor:
              account.currency.color /* PLACEHOLDER FOR THE ICON */
          }}
        />
        <LText
          numberOfLines={1}
          style={{
            fontSize: 14,
            flex: 1
          }}
        >
          {account.name}
        </LText>
        <BalanceChartMiniature
          width={50}
          height={50}
          data={account.data}
          color={account.currency.color}
          withGradient={false}
        />
        <CurrencyUnitValue
          ltextProps={{
            semiBold: true,
            style: {
              fontSize: 14
            }
          }}
          unit={account.currency.units[0]}
          value={account.amount}
        />
      </View>
    );
  }
}

class AccountCard extends PureComponent<*, *> {
  onGoAccountSettings = () => {
    const { account, topLevelNavigation } = this.props;
    topLevelNavigation.navigate("AccountSettings", {
      accountId: account.id
    });
  };
  render() {
    const { account, onPress } = this.props;
    return (
      <TouchableWithoutFeedback onPress={onPress}>
        <View
          style={{
            width: 280,
            height: 220,
            padding: 10,
            backgroundColor: "white"
          }}
        >
          <View
            style={{
              flex: 1,
              flexDirection: "column",
              justifyContent: "flex-end"
            }}
          >
            <View
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                marginVertical: 10
              }}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  marginRight: 10,
                  backgroundColor:
                    account.currency.color /* PLACEHOLDER FOR THE ICON */
                }}
              />
              <View
                style={{
                  flexDirection: "column",
                  flex: 1
                }}
              >
                <LText
                  semiBold
                  numberOfLines={1}
                  style={{
                    fontSize: 14
                  }}
                >
                  {account.name}
                </LText>
                <LText
                  numberOfLines={1}
                  style={{
                    fontSize: 12,
                    color: "#999"
                  }}
                >
                  {account.currency.name}
                </LText>
              </View>

              <TouchableOpacity onPress={this.onGoAccountSettings}>
                <Image
                  source={require("../images/accountsettings.png")}
                  style={{ width: 30, height: 30 }}
                />
              </TouchableOpacity>
            </View>

            <View>
              <CurrencyUnitValue
                unit={account.currency.units[0]}
                value={account.amount}
                ltextProps={{
                  semiBold: true,
                  style: {
                    alignSelf: "flex-start",
                    fontSize: 22,
                    marginVertical: 10
                  }
                }}
              />
            </View>
            <BalanceChartMiniature
              width={260}
              height={100}
              data={account.data}
              color={account.currency.color}
            />
          </View>
        </View>
      </TouchableWithoutFeedback>
    );
  }
}

class AccountHeadMenu extends Component<{ topLevelNavigation: *, account: * }> {
  onSend = () => {
    const { account, topLevelNavigation } = this.props;
    topLevelNavigation.navigate("SendFunds", {
      goBackKey: topLevelNavigation.state.key,
      accountId: account.id
    });
  };
  onReceive = () => {
    const { account, topLevelNavigation } = this.props;
    topLevelNavigation.navigate("ReceiveFunds", {
      goBackKey: topLevelNavigation.state.key,
      accountId: account.id
    });
  };
  render() {
    return (
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-around"
        }}
      >
        <WhiteButton
          onPress={this.onSend}
          containerStyle={{ width: 100 }}
          title="Send"
        />
        <WhiteButton
          onPress={this.onReceive}
          containerStyle={{ width: 100 }}
          title="Receive"
        />
      </View>
    );
  }
}

class OperationRow extends Component<{ operation: * }> {
  render() {
    const { operation } = this.props;
    const currency = operation.account.currency;
    return (
      <View
        style={{
          marginVertical: 1,
          height: 60,
          padding: 10,
          borderRadius: 4,
          backgroundColor: "white",
          alignItems: "center",
          flexDirection: "row"
        }}
      >
        <View
          style={{
            flexDirection: "column",
            flex: 1,
            marginRight: 10
          }}
        >
          <LText
            numberOfLines={1}
            style={{
              fontSize: 14
            }}
          >
            {operation.address}
          </LText>
          <LText
            numberOfLines={1}
            style={{
              fontSize: 14,
              color: "#999"
            }}
          >
            {moment(operation.receivedAt).calendar()}
          </LText>
        </View>
        <CurrencyUnitValue
          ltextProps={{
            style: {
              fontSize: 14,
              color: operation.balance > 0 ? colors.green : "#999"
            }
          }}
          unit={currency.units[0]}
          value={operation.balance}
        />
      </View>
    );
  }
}

class AccountBody extends Component<{ account: * }> {
  keyExtractor = (item: *) => item.id;

  renderItem = ({ item, index }: *) => <OperationRow operation={item} />;
  render() {
    const { account } = this.props;
    return (
      <FlatList
        data={account.operations}
        renderItem={this.renderItem}
        keyExtractor={this.keyExtractor}
      />
    );
  }
}

const navigationOptions = {
  tabBarIcon: ({ tintColor }: *) => (
    <Image
      source={require("../images/accounts.png")}
      style={{ tintColor, width: 32, height: 32 }}
    />
  )
};

export default class Accounts extends Component<
  *,
  {
    expandedMode: boolean,
    selectedIndex: number,
    accounts: *
  }
> {
  static navigationOptions = navigationOptions;
  state = {
    expandedMode: false,
    selectedIndex: 0,
    accounts: fakeAccounts
  };

  carousel: ?Carousel;
  onCarousel = (ref: ?Carousel) => {
    this.carousel = ref;
  };

  onToggleExpandedMode = () => {
    this.setState(({ expandedMode }) => ({ expandedMode: !expandedMode }));
  };

  onAddAccount = () => {
    this.props.screenProps.topLevelNavigation.navigate("AddAccount");
  };

  onPressExpandedItem = (selectedIndex: number) => {
    this.setState({ selectedIndex, expandedMode: false });
  };

  onSnapToItem = (selectedIndex: number) => {
    this.setState({ selectedIndex });
  };

  onItemFullPress = (item: *, index: *) => {
    const { carousel } = this;
    if (carousel && index !== this.state.selectedIndex) {
      carousel.snapToItem(index);
    }
  };

  keyExtractor = (item: *) => item.id;

  renderHeader = () => {
    const { expandedMode } = this.state;
    return (
      <View style={styles.header}>
        <TouchableOpacity onPress={this.onToggleExpandedMode}>
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
        <TouchableOpacity onPress={this.onAddAccount}>
          <Image
            source={require("../images/accountsplus.png")}
            style={{ width: 22, height: 21 }}
          />
        </TouchableOpacity>
      </View>
    );
  };

  renderItemExpanded = ({ item, index }: *) => (
    <TouchableOpacity onPress={() => this.onPressExpandedItem(index)}>
      <AccountRow account={item} />
    </TouchableOpacity>
  );

  renderItemFull = ({ item, index }: *) => (
    <AccountCard
      account={item}
      topLevelNavigation={this.props.screenProps.topLevelNavigation}
      onPress={() => this.onItemFullPress(item, index)}
    />
  );

  render() {
    const { accounts, expandedMode, selectedIndex } = this.state;
    const { screenProps: { topLevelNavigation } } = this.props;
    const account = accounts[selectedIndex];
    return (
      <View style={styles.root}>
        <ScreenGeneric renderHeader={this.renderHeader}>
          <ScrollView bounces={false} style={styles.body}>
            {expandedMode ? (
              // TODO expanded mode shouldn't unmount the main screen part but should be position absoluted on top
              <FlatList
                style={styles.expanded}
                data={accounts}
                keyExtractor={this.keyExtractor}
                renderItem={this.renderItemExpanded}
              />
            ) : (
              <View>
                <View style={styles.carousel}>
                  <Carousel
                    ref={this.onCarousel}
                    data={accounts}
                    keyExtractor={this.keyExtractor}
                    itemWidth={280}
                    itemHeight={220}
                    sliderWidth={windowDim.width}
                    sliderHeight={300}
                    inactiveSlideOpacity={0.4}
                    onSnapToItem={this.onSnapToItem}
                    firstItem={selectedIndex}
                    renderItem={this.renderItemFull}
                  />
                  <Pagination
                    dotsLength={accounts.length}
                    activeDotIndex={selectedIndex}
                    dotContainerStyle={styles.paginationDotContainerStyle}
                    dotStyle={styles.paginationDotStyle}
                    inactiveDotOpacity={0.4}
                    inactiveDotScale={0.6}
                  />
                  <View style={styles.accountHeadMenu}>
                    {account ? (
                      <AccountHeadMenu
                        topLevelNavigation={topLevelNavigation}
                        account={account}
                      />
                    ) : null}
                  </View>
                </View>
                <View style={styles.accountBody}>
                  {account ? (
                    <AccountBody
                      topLevelNavigation={topLevelNavigation}
                      account={account}
                    />
                  ) : null}
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
  },
  accountHeadMenu: {
    position: "relative",
    bottom: -20
  },
  accountBody: {
    height: 800,
    paddingTop: 40
  },
  paginationDotContainerStyle: {
    marginHorizontal: 4
  },
  paginationDotStyle: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.92)"
  }
});
