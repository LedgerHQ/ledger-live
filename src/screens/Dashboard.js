/* @flow */
import React, { Component } from "react";
import { getFiatUnit, formatCurrencyUnit } from "@ledgerhq/currencies";
import {
  Image,
  View,
  FlatList,
  RefreshControl,
  StyleSheet,
  ActivityIndicator
} from "react-native";
import ScreenGeneric from "../components/ScreenGeneric";
import colors from "../colors";
import { getTransactions } from "../API";
import LText from "../components/LText";
import BalanceChart from "../components/BalanceChart";
import { genBalanceData } from "../mock/account";
import { withLocale } from "../components/LocaleContext";

const transactionsPromise = getTransactions(
  "1XPTgDRhN8RFnzniWCddobD9iKZatrvH4"
);

class ListHeaderComponent extends Component<*, *> {
  state = {
    data: genBalanceData(8, 86400000)
  };
  render() {
    const { data } = this.state;
    return (
      <View style={styles.carouselCountainer}>
        <View style={{ padding: 10, flexDirection: "row" }}>
          <LText style={styles.balanceText}>Total balance: </LText>
          <LText bold style={styles.balanceText}>
            {formatCurrencyUnit(getFiatUnit("USD"), 4728252, {
              showCode: true
            })}
          </LText>
        </View>
        <BalanceChart
          width={400}
          height={250}
          data={data}
          unit={getFiatUnit("USD")}
        />
      </View>
    );
  }
}

class Dashboard extends Component<*, *> {
  static navigationOptions = {
    tabBarIcon: ({ tintColor }: *) => (
      <Image
        source={require("../images/dashboard.png")}
        style={{ tintColor, width: 32, height: 32 }}
      />
    )
  };

  state = {
    transactions: null,
    refreshing: false
  };

  componentDidMount() {
    transactionsPromise.then(transactions => {
      console.log(transactions);
      this.setState({ transactions });
    });
  }

  onRefresh = () => {
    this.setState({ refreshing: true });
    new Promise(s => setTimeout(s, 500 + 500 * Math.random()))
      .then(() => transactionsPromise)
      .then(transactions => {
        this.setState({ transactions, refreshing: false });
      });
  };

  keyExtractor = (item: string) => item;

  renderItem = ({ item }: *) => (
    <LText
      numberOfLines={1}
      ellipsizeMode="middle"
      style={{ paddingVertical: 12, paddingHorizontal: 20 }}
    >
      {item}
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

  scrollUp = () => {
    this.refs.flatList.scrollToOffset({ offset: 0 });
  };

  render() {
    const { transactions, refreshing } = this.state;
    return (
      <ScreenGeneric
        onPressHeader={this.scrollUp}
        renderHeader={this.renderHeader}
      >
        <View style={styles.topBackground} />
        <FlatList
          ref="flatList"
          style={styles.flatList}
          contentContainerStyle={styles.flatListContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={this.onRefresh}
            />
          }
          ListHeaderComponent={ListHeaderComponent}
          ListFooterComponent={
            transactions
              ? null
              : () => (
                  <ActivityIndicator
                    style={{ margin: 40 }}
                    color={colors.blue}
                  />
                )
          }
          data={transactions ? transactions.txsHash : []}
          keyExtractor={this.keyExtractor}
          renderItem={this.renderItem}
        />
      </ScreenGeneric>
    );
  }
}

export default withLocale(Dashboard);

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
    fontSize: 18
  }
});
