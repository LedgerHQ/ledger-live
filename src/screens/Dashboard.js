/* @flow */
import React, { Component } from "react";
import {
  Image,
  View,
  Text,
  FlatList,
  RefreshControl,
  StyleSheet,
  ActivityIndicator
} from "react-native";
import { TabNavigator, TabBarTop } from "react-navigation";
import ScreenGeneric from "../components/ScreenGeneric";
import colors from "../colors";
import { getTransactions } from "../API";
import LText from "../components/LText";

const transactionsPromise = getTransactions(
  "1XPTgDRhN8RFnzniWCddobD9iKZatrvH4"
);

class ListHeaderComponent extends Component<*> {
  render() {
    return (
      <View style={styles.carouselCountainer}>
        <LText style={styles.testText}>Aa Ledger (default)</LText>
        <LText style={styles.testText} semiBold>
          Aa Ledger (default semiBold)
        </LText>
        <LText style={styles.testText} bold>
          Aa Ledger (default bold)
        </LText>
        <LText style={styles.testText} secondary>
          Aa Ledger (secondary)
        </LText>
        <LText style={styles.testText} secondary semiBold>
          Aa Ledger (secondary semiBold)
        </LText>
        <LText style={styles.testText} secondary bold>
          Aa Ledger (secondary bold)
        </LText>
      </View>
    );
  }
}

export default class Dashboard extends Component<*, *> {
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

  componentWillMount() {
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
        console.log(transactions);
        this.setState({ transactions, refreshing: false });
      });
  };

  keyExtractor = (item: string) => item;

  renderItem = ({ item }: *) => (
    <Text
      numberOfLines={1}
      ellipsizeMode="middle"
      style={{ paddingVertical: 12, paddingHorizontal: 20 }}
    >
      {item}
    </Text>
  );

  renderHeader = () => {
    return (
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerText}>Good morning, Khalil!</Text>
          <Text style={styles.headerTextSubtitle}>
            Here's a summary of your accounts
          </Text>
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
              tintColor="white"
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

const styles = StyleSheet.create({
  carouselCountainer: {
    padding: 40,
    height: 300,
    backgroundColor: colors.blue
  },
  topBackground: {
    position: "absolute",
    top: 0,
    width: 600,
    height: 300,
    backgroundColor: colors.blue
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
  testText: {
    color: "white",
    fontSize: 18
  }
});
