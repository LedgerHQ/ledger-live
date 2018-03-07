/* @flow */
import React, { Component, PureComponent } from "react";
import {
  ScrollView,
  View,
  FlatList,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Image,
  Dimensions,
  RefreshControl
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
import CurrencyIcon from "../components/CurrencyIcon";

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
        <View style={{ marginRight: 10 }}>
          <CurrencyIcon currency={account.currency} size={32} />
        </View>
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
          value={account.balance}
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
              <View style={{ marginRight: 10 }}>
                <CurrencyIcon currency={account.currency} size={32} />
              </View>
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
                value={account.balance}
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
          justifyContent: "space-around",
          marginBottom: 10
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

class OperationRow extends PureComponent<{ operation: * }> {
  render() {
    const { operation } = this.props;
    const currency = operation.account.currency;
    return (
      <View
        style={{
          height: 60,
          padding: 10,
          borderBottomWidth: 1,
          borderBottomColor: "#eee",
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
              color: operation.amount > 0 ? colors.green : colors.red
            }
          }}
          unit={currency.units[0]}
          value={operation.amount}
        />
      </View>
    );
  }
}

class AccountsCarousel extends Component<{
  topLevelNavigation: *,
  accounts: *,
  selectedIndex: number,
  onSelectIndex: number => void
}> {
  carousel: ?Carousel;
  onCarousel = (ref: ?Carousel) => {
    this.carousel = ref;
  };

  keyExtractor = (item: *) => item.id;

  onItemFullPress = (item: *, index: *) => {
    const { carousel } = this;
    if (carousel && index !== this.props.selectedIndex) {
      carousel.snapToItem(index);
    }
  };

  snapToItem = (...args) => {
    const { carousel } = this;
    if (carousel) carousel.snapToItem(...args);
  };

  renderItemFull = ({ item, index }: *) => (
    <AccountCard
      account={item}
      topLevelNavigation={this.props.topLevelNavigation}
      onPress={() => this.onItemFullPress(item, index)}
    />
  );

  render() {
    const { accounts, onSelectIndex, selectedIndex } = this.props;
    return (
      <Carousel
        ref={this.onCarousel}
        data={accounts}
        keyExtractor={this.keyExtractor}
        itemWidth={280}
        itemHeight={220}
        sliderWidth={windowDim.width}
        sliderHeight={300}
        inactiveSlideOpacity={0.4}
        onSnapToItem={onSelectIndex}
        firstItem={selectedIndex}
        renderItem={this.renderItemFull}
      />
    );
  }
}

class AccountBody extends Component<
  { style: *, Header: *, account: ?*, visible?: boolean },
  *
> {
  state = { refreshing: false };

  flatList: ?FlatList<*>;
  onFlatListRef = (ref: ?FlatList<*>) => {
    this.flatList = ref;
  };

  componentDidUpdate(prevProps) {
    const { flatList } = this;
    // when flatlist become unvisible, we want to scroll it on top again for when we come back
    if (flatList && prevProps.visible && !this.props.visible) {
      flatList.scrollToOffset({ offset: 0, animated: false });
    }
  }

  onRefresh = () => {
    this.setState({ refreshing: true });
    new Promise(s => setTimeout(s, 500 + 500 * Math.random())).then(() => {
      this.setState({ refreshing: false });
    });
  };

  keyExtractor = (item: *) => item.id;

  renderItem = ({ item, index }: *) => <OperationRow operation={item} />;

  render() {
    const { style, Header, account, visible } = this.props;
    const { refreshing } = this.state;
    return (
      <FlatList
        ref={this.onFlatListRef}
        style={[style, !visible && { display: "none" }]}
        refreshControl={
          <RefreshControl
            tintColor="white"
            refreshing={refreshing}
            onRefresh={this.onRefresh}
          />
        }
        renderItem={this.renderItem}
        data={account ? account.operations : []}
        ListHeaderComponent={Header}
        keyExtractor={this.keyExtractor}
      />
    );
  }
}

class AccountExpanded extends Component<{
  style: *,
  accounts: ?*,
  onPressExpandedItem: *
}> {
  keyExtractor = (item: *) => item.id;

  renderItemExpanded = ({ item, index }: *) => (
    <TouchableOpacity onPress={() => this.props.onPressExpandedItem(index)}>
      <AccountRow account={item} />
    </TouchableOpacity>
  );

  render() {
    const { style, accounts } = this.props;
    return (
      <FlatList
        style={style}
        data={accounts}
        keyExtractor={this.keyExtractor}
        renderItem={this.renderItemExpanded}
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

  onToggleExpandedMode = () => {
    this.setState(({ expandedMode }) => ({ expandedMode: !expandedMode }));
  };

  onAddAccount = () => {
    this.props.screenProps.topLevelNavigation.navigate("AddAccount");
  };

  onPressExpandedItem = (selectedIndex: number) => {
    this.setState({ selectedIndex, expandedMode: false });
  };

  onSelectIndex = (selectedIndex: number) => {
    this.setState({ selectedIndex });
  };

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
        <LText style={styles.headerText}>Accounts</LText>
        <TouchableOpacity onPress={this.onAddAccount}>
          <Image
            source={require("../images/accountsplus.png")}
            style={{ width: 22, height: 21 }}
          />
        </TouchableOpacity>
      </View>
    );
  };

  renderAccountBodyHeader = () => {
    const { accounts, selectedIndex } = this.state;
    const { screenProps: { topLevelNavigation } } = this.props;
    const account = accounts[selectedIndex];
    return (
      <View style={styles.carousel}>
        <AccountsCarousel
          accounts={accounts}
          onSelectIndex={this.onSelectIndex}
          selectedIndex={selectedIndex}
          topLevelNavigation={topLevelNavigation}
        />
        <Pagination
          dotsLength={accounts.length}
          activeDotIndex={selectedIndex}
          dotContainerStyle={styles.paginationDotContainerStyle}
          dotStyle={styles.paginationDotStyle}
          inactiveDotOpacity={0.4}
          inactiveDotScale={0.6}
        />
        {account ? (
          <AccountHeadMenu
            topLevelNavigation={topLevelNavigation}
            account={account}
          />
        ) : null}
      </View>
    );
  };

  render() {
    const { accounts, expandedMode, selectedIndex } = this.state;
    const { screenProps: { topLevelNavigation } } = this.props;
    const account = accounts[selectedIndex];
    return (
      <View style={styles.root}>
        <ScreenGeneric renderHeader={this.renderHeader}>
          <View style={styles.topBackground} />
          {/* FIXME perf are not good, investigate why */}
          {expandedMode ? (
            <AccountExpanded
              style={styles.expanded}
              accounts={accounts}
              onPressExpandedItem={this.onPressExpandedItem}
            />
          ) : null}
          <AccountBody
            visible={!expandedMode}
            style={styles.accountBody}
            topLevelNavigation={topLevelNavigation}
            account={account}
            Header={this.renderAccountBodyHeader}
          />
        </ScreenGeneric>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  topBackground: {
    position: "absolute",
    top: 0,
    width: 600,
    height: 300,
    backgroundColor: colors.blue
  },
  root: {
    flex: 1
  },
  body: {
    flex: 1
  },
  accountBody: {
    flex: 1
  },
  carousel: {
    paddingTop: 20,
    paddingBottom: 0,
    backgroundColor: colors.blue
  },
  expanded: {
    backgroundColor: colors.blue,
    flex: 1
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
