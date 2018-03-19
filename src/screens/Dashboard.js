/* @flow */
import React, { Component, PureComponent } from "react";
import { getFiatUnit, formatCurrencyUnit } from "@ledgerhq/currencies";
import {
  Image,
  View,
  FlatList,
  RefreshControl,
  StyleSheet,
  ActivityIndicator
} from "react-native";
import { connect } from "react-redux";
import type { Currency, Unit } from "@ledgerhq/currencies";
import type { Account, Operation } from "../types/common";
import ScreenGeneric from "../components/ScreenGeneric";
import colors from "../colors";
import LText from "../components/LText";
import BalanceChart from "../components/BalanceChart";
import BlueButton from "../components/BlueButton";
import { withLocale } from "../components/LocaleContext";
import {
  getVisibleAccounts,
  getBalanceHistoryUntilNow
} from "../reducers/accounts";
import { calculateCounterValueSelector } from "../reducers/counterValues";

class ListHeaderComponent extends PureComponent<
  {
    accounts: Account[],
    totalBalance: number,
    calculateCounterValue: (
      currency: Currency,
      fiatUnit: Unit
    ) => (number, Date) => number
  },
  *
> {
  render() {
    const { accounts, calculateCounterValue } = this.props;
    const fiatUnit = getFiatUnit("USD"); // FIXME no more hardcoded

    const data =
      accounts.length === 0
        ? null
        : accounts
            .map(account => {
              const history = getBalanceHistoryUntilNow(account, 30);
              const calculateAccountCounterValue = calculateCounterValue(
                account.currency,
                fiatUnit
              );
              return history.map(h => ({
                date: h.date,
                value: calculateAccountCounterValue(h.value, h.date)
              }));
            })
            .reduce((acc, history) =>
              acc.map((a, i) => ({
                date: a.date,
                value: a.value + history[i].value
              }))
            );

    return (
      <View style={styles.carouselCountainer}>
        <View style={{ padding: 10, flexDirection: "row" }}>
          <LText semiBold style={styles.balanceText}>
            {formatCurrencyUnit(fiatUnit, this.props.totalBalance, {
              showCode: true
            })}
          </LText>
        </View>
        {data ? (
          <BalanceChart
            width={400}
            height={250}
            data={data}
            unit={getFiatUnit("USD")}
          />
        ) : null}
      </View>
    );
  }
}

const mapStateToProps = state => ({
  accounts: getVisibleAccounts(state),
  calculateCounterValue: calculateCounterValueSelector(state)
});

class Dashboard extends Component<
  {
    accounts: Account[],
    calculateCounterValue: *,
    t: *,
    screenProps: *
  },
  *
> {
  static navigationOptions = {
    tabBarIcon: ({ tintColor }: *) => (
      <Image
        source={require("../images/dashboard.png")}
        style={{ tintColor, width: 32, height: 32 }}
      />
    )
  };

  state = {
    data: null,
    refreshing: false
  };

  componentDidMount() {
    this.load();
  }

  load = async () => {
    // TODO we want to trigger a counter value refetch

    // TODO generate data for a SectionList
    this.setState({
      // FIXME we need to generate the section list data properly.
      // maybe write a selector function in store side
      data: this.props.accounts.reduce(
        (all, account) => all.concat(account.operations),
        []
      )
    });
    return Promise.resolve();
  };

  onRefresh = async () => {
    this.setState({ refreshing: true });
    try {
      await this.load();
    } finally {
      this.setState({ refreshing: false });
    }
  };

  keyExtractor = (item: Operation) => item.id;

  renderItem = ({ item }: *) => (
    <LText
      numberOfLines={1}
      ellipsizeMode="middle"
      style={{ paddingVertical: 12, paddingHorizontal: 20 }}
    >
      {item.address}
    </LText>
  );

  renderHeader = () => {
    const { t } = this.props;
    return (
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <LText style={styles.headerText}>
            {t("home_title", { name: "Khalil" })}
          </LText>
          <LText style={styles.headerTextSubtitle}>{t("home_subtitle")}</LText>
        </View>
      </View>
    );
  };

  flatList: ?FlatList<*>;
  onFlatListRef = (ref: ?FlatList<*>) => {
    this.flatList = ref;
  };

  scrollUp = () => {
    const { flatList } = this;
    if (flatList) flatList.scrollToOffset({ offset: 0 });
  };

  goToImportAccounts = () => {
    this.props.screenProps.topLevelNavigation.navigate("ImportAccounts");
  };

  render() {
    const { accounts, calculateCounterValue } = this.props;
    const { data, refreshing } = this.state;
    const totalBalance = accounts.reduce(
      (sum, account) =>
        sum +
        calculateCounterValue(account.currency, getFiatUnit("USD"))(
          account.balance
        ),
      0
    );
    return accounts.length === 0 ? (
      <View
        style={{
          flex: 1,
          padding: 20,
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        <LText semiBold style={{ fontSize: 24, marginBottom: 20 }}>
          No accounts yet!
        </LText>
        <BlueButton
          title="Import Accounts from Desktop"
          onPress={this.goToImportAccounts}
        />
      </View>
    ) : (
      <ScreenGeneric
        onPressHeader={this.scrollUp}
        renderHeader={this.renderHeader}
      >
        <View style={styles.topBackground} />

        <FlatList
          ref={this.onFlatListRef}
          style={styles.flatList}
          contentContainerStyle={styles.flatListContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={this.onRefresh}
            />
          }
          ListHeaderComponent={() => (
            <ListHeaderComponent
              totalBalance={totalBalance}
              accounts={accounts}
              calculateCounterValue={calculateCounterValue}
            />
          )}
          ListFooterComponent={
            data
              ? null
              : () => (
                  <ActivityIndicator
                    style={{ margin: 40 }}
                    color={colors.blue}
                  />
                )
          }
          data={data || []}
          keyExtractor={this.keyExtractor}
          renderItem={this.renderItem}
        />
      </ScreenGeneric>
    );
  }
}

export default withLocale(connect(mapStateToProps)(Dashboard));

const styles = StyleSheet.create({
  carouselCountainer: {
    padding: 0,
    height: 300,
    backgroundColor: "white"
  },
  topBackground: {
    position: "absolute",
    top: 0,
    width: 600,
    height: 300,
    backgroundColor: "white"
  },
  flatList: {
    flex: 1
  },
  flatListContent: {
    backgroundColor: colors.lightBackground
  },
  header: {
    alignItems: "center",
    justifyContent: "space-between",
    flex: 1,
    flexDirection: "row",
    paddingHorizontal: 10
  },
  headerLeft: {
    justifyContent: "space-around"
  },
  headerTextSubtitle: {
    color: "white",
    opacity: 0.8,
    fontSize: 12
  },
  headerText: {
    color: "white",
    fontSize: 16
  },
  balanceText: {
    fontSize: 24
  }
});
