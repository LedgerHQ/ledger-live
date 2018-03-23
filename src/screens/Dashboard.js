/* @flow */
import React, { Component, PureComponent, Fragment } from "react";
import { getFiatUnit, formatCurrencyUnit } from "@ledgerhq/currencies";
import moment from "moment";
import {
  Image,
  View,
  StatusBar,
  SectionList,
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
import CurrencyUnitValue from "../components/CurrencyUnitValue";
import BalanceChartMiniature from "../components/BalanceChartMiniature";
import CurrencyIcon from "../components/CurrencyIcon";
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

type DailyOperationsSection = {
  day: Date,
  data: Operation[]
};

function startOfDay(t) {
  return new Date(t.getFullYear(), t.getMonth(), t.getDate());
}

export function groupAccountsOperationsByDay(
  accounts: Account[],
  count: number
): DailyOperationsSection[] {
  // FIXME later we'll do it in a more lazy way, without sorting ALL ops
  const operations = accounts
    .reduce((ops, acc) => ops.concat(acc.operations), [])
    .sort((a, b) => new Date(b.receivedAt) - new Date(a.receivedAt));

  if (operations.length === 0) return [];
  const sections = [];
  let day = startOfDay(new Date(operations[0].receivedAt));
  let data = [];
  const max = Math.min(count, operations.length);
  for (let i = 0; i < max; i++) {
    const op = operations[i];
    const date = new Date(op.receivedAt);
    if (date < day) {
      sections.push({ day, data });
      day = startOfDay(date);
      data = [op];
    } else {
      data.push(op);
    }
  }
  sections.push({ day, data });
  return sections;
}

class OperationRow extends PureComponent<{
  operation: Operation,
  account: Account
}> {
  render() {
    const { operation, account } = this.props;
    const { unit, currency } = account;
    return (
      <View
        style={{
          padding: 20,
          borderBottomWidth: 1,
          borderBottomColor: "#eee",
          backgroundColor: "white",
          alignItems: "center",
          flexDirection: "row"
        }}
      >
        <CurrencyIcon size={32} currency={currency} />
        <View
          style={{
            flexDirection: "column",
            flex: 1,
            marginHorizontal: 10
          }}
        >
          <LText
            numberOfLines={1}
            semiBold
            ellipsizeMode="clip"
            style={{ marginLeft: 6, fontSize: 12 }}
          >
            {account.name}
          </LText>
          <LText
            numberOfLines={1}
            ellipsizeMode="middle"
            style={{
              fontSize: 12,
              opacity: 0.5
            }}
          >
            {operation.address}
          </LText>
        </View>
        <CurrencyUnitValue
          ltextProps={{
            style: {
              fontSize: 14,
              color: operation.amount > 0 ? colors.green : colors.red
            }
          }}
          unit={unit}
          value={operation.amount}
        />
      </View>
    );
  }
}

const ListFooterComponent = () => (
  <ActivityIndicator style={{ margin: 40 }} color={colors.blue} />
);

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
    headerSwitched: false,
    refreshing: false,
    opCount: 50
  };

  onRefresh = async () => {
    this.setState({ refreshing: true });
    try {
      this.setState({ opCount: 50 });
    } finally {
      this.setState({ refreshing: false });
    }
  };

  keyExtractor = (item: Operation) => item.id;

  renderItem = ({ item }: *) => (
    <OperationRow operation={item} account={item.account} />
  );

  renderSectionHeader = ({ section }: *) => (
    <LText
      numberOfLines={1}
      semiBold
      style={{
        fontSize: 12,
        color: "#999",
        paddingVertical: 12,
        paddingHorizontal: 20,
        backgroundColor: colors.lightBackground
      }}
    >
      {moment(section.day).calendar(null, {
        sameDay: "[Today]",
        nextDay: "[Tomorrow]",
        lastDay: "[Yesterday]",
        lastWeek: "[Last] dddd",
        sameElse: "DD/MM/YYYY"
      })}
    </LText>
  );

  renderHeader = ({ totalBalance }) => {
    const { t, accounts, calculateCounterValue } = this.props;
    if (accounts.length === 0) return null;
    const { headerSwitched } = this.state;
    const fiatUnit = getFiatUnit("USD");
    const data = accounts
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
      <View style={styles.header}>
        {headerSwitched ? (
          <Fragment>
            <LText semiBold style={styles.balanceTextHeader}>
              {formatCurrencyUnit(fiatUnit, totalBalance, {
                showCode: true
              })}
            </LText>
            <BalanceChartMiniature
              width={100}
              height={60}
              data={data}
              color="white"
            />
          </Fragment>
        ) : (
          <View style={styles.headerLeft}>
            <LText style={styles.headerText}>
              {t("home_title", { name: "John Doe" })}
            </LText>
            <LText style={styles.headerTextSubtitle}>
              {t("home_subtitle", { count: accounts.length })}
            </LText>
          </View>
        )}
      </View>
    );
  };

  sectionList: ?SectionList<*>;
  onSectionListRef = (ref: ?SectionList<*>) => {
    this.sectionList = ref;
  };

  scrollUp = () => {
    const { sectionList } = this;
    if (sectionList) {
      sectionList.scrollToLocation({
        itemIndex: 0,
        sectionIndex: 0,
        viewOffset: 340
      });
    }
  };

  goToImportAccounts = () => {
    this.props.screenProps.topLevelNavigation.navigate("ImportAccounts");
  };

  onEndReached = () => {
    this.setState(({ opCount }) => ({ opCount: opCount + 50 }));
  };

  onScroll = ({ nativeEvent: { contentOffset } }) => {
    const headerSwitched = contentOffset.y > 300;
    this.setState(
      s => (headerSwitched !== s.headerSwitched ? { headerSwitched } : null)
    );
  };

  ListHeaderComponent = () => {
    const { accounts, calculateCounterValue } = this.props;
    const totalBalance = accounts.reduce(
      (sum, account) =>
        sum +
        calculateCounterValue(account.currency, getFiatUnit("USD"))(
          account.balance
        ),
      0
    );
    return (
      <ListHeaderComponent
        totalBalance={totalBalance}
        accounts={accounts}
        calculateCounterValue={calculateCounterValue}
      />
    );
  };

  render() {
    const { accounts, calculateCounterValue } = this.props;
    const { opCount, refreshing, headerSwitched } = this.state;
    const data = groupAccountsOperationsByDay(accounts, opCount);
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
        extraData={{ totalBalance }}
      >
        <View style={styles.topBackground} />
        <SectionList
          sections={data || []}
          ref={this.onSectionListRef}
          style={styles.sectionList}
          contentContainerStyle={styles.sectionListContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={this.onRefresh}
            />
          }
          ListHeaderComponent={this.ListHeaderComponent}
          ListFooterComponent={data ? null : ListFooterComponent}
          keyExtractor={this.keyExtractor}
          renderItem={this.renderItem}
          renderSectionHeader={this.renderSectionHeader}
          onEndReached={this.onEndReached}
          onScroll={this.onScroll}
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
  sectionList: {
    flex: 1
  },
  sectionListContent: {
    backgroundColor: colors.lightBackground
  },
  header: {
    alignItems: "center",
    justifyContent: "space-between",
    flex: 1,
    flexDirection: "row",
    paddingLeft: 10
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
  },
  balanceTextHeader: {
    color: "white",
    fontSize: 24
  }
});
