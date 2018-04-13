/* @flow */
import React, { Component } from "react";
import {
  Image,
  View,
  SectionList,
  RefreshControl,
  StyleSheet
} from "react-native";
import { connect } from "react-redux";
import type {
  Account,
  Operation,
  BalanceHistory,
  FiatUnit,
  CalculateCounterValue
} from "@ledgerhq/wallet-common/lib/types";
import { groupAccountsOperationsByDay } from "@ledgerhq/wallet-common/lib/helpers/account";
import ScreenGeneric from "../../components/ScreenGeneric";
import colors from "../../colors";
import {
  getVisibleAccounts,
  globalBalanceHistorySelector
} from "../../reducers/accounts";
import { calculateCounterValueSelector } from "../../reducers/counterValues";
import { fiatUnitSelector } from "../../reducers/settings";
import ListHeaderComponent from "./ListHeaderComponent";
import OperationRow from "./OperationRow";
import Onboarding from "./Onboarding";
import Header from "./Header";
import HeaderScrolled from "./HeaderScrolled";
import SectionHeader from "./SectionHeader";
import NoMoreOperationFooter from "../../components/NoMoreOperationFooter";
import NoOperationFooter from "../../components/NoOperationFooter";
import LoadingFooter from "../../components/LoadingFooter";
import { withCounterValuePolling } from "../../components/CounterValuePolling";
import type { CounterValuePolling } from "../../components/CounterValuePolling";

const navigationOptions = {
  tabBarIcon: ({ tintColor }: *) => (
    <Image
      source={require("../../images/dashboard.png")}
      style={{ tintColor, width: 32, height: 32 }}
    />
  )
};

const mapStateToProps = state => {
  const globalBalanceHistory = globalBalanceHistorySelector(state);
  const totalBalance =
    globalBalanceHistory[globalBalanceHistory.length - 1].value;
  const totalBalancePeriodBegin = globalBalanceHistory[0].value;
  return {
    accounts: getVisibleAccounts(state),
    calculateCounterValue: calculateCounterValueSelector(state),
    globalBalanceHistory,
    totalBalancePeriodBegin,
    totalBalance,
    fiatUnit: fiatUnitSelector(state)
  };
};

class Dashboard extends Component<
  {
    accounts: Account[],
    globalBalanceHistory: BalanceHistory,
    totalBalance: number,
    totalBalancePeriodBegin: number,
    fiatUnit: FiatUnit,
    calculateCounterValue: CalculateCounterValue,
    counterValuePolling: CounterValuePolling,
    screenProps: {
      topLevelNavigation: *
    }
  },
  {
    headerScrolled: boolean,
    refreshing: boolean,
    opCount: number
  }
> {
  static navigationOptions = navigationOptions;

  state = {
    headerScrolled: false,
    refreshing: false,
    opCount: 50
  };

  onRefresh = async () => {
    this.setState({ refreshing: true });
    try {
      this.setState({ opCount: 50 });
      await this.props.counterValuePolling.poll();
    } finally {
      this.setState({ refreshing: false });
    }
  };

  keyExtractor = (item: Operation) => item.id;

  renderItem = ({ item }: { item: Operation }) => {
    const account = this.props.accounts.find(a => a.id === item.accountId);
    if (!account) return null;
    return <OperationRow operation={item} account={account} />;
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
    this.props.screenProps.topLevelNavigation.navigate({
      routeName: "ImportAccounts",
      key: "importaccounts"
    });
  };

  onEndReached = () => {
    this.setState(({ opCount }) => ({ opCount: opCount + 50 }));
  };

  onScroll = ({
    nativeEvent: { contentOffset }
  }: {
    nativeEvent: { contentOffset: { y: number } }
  }) => {
    const headerScrolled = contentOffset.y > 300;
    this.setState(
      s => (headerScrolled !== s.headerScrolled ? { headerScrolled } : null)
    );
  };

  ListHeaderComponent = () => <ListHeaderComponent {...this.props} />;

  render() {
    const { accounts } = this.props;
    const { opCount, refreshing, headerScrolled } = this.state;
    if (accounts.length === 0) {
      return <Onboarding goToImportAccounts={this.goToImportAccounts} />;
    }
    const { sections, completed } = groupAccountsOperationsByDay(
      accounts,
      opCount
    );
    return (
      <ScreenGeneric
        onPressHeader={this.scrollUp}
        Header={headerScrolled ? HeaderScrolled : Header}
        extraData={this.props}
      >
        <View style={styles.topBackground} />
        <SectionList
          sections={(sections: any)}
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
          ListFooterComponent={
            !completed
              ? LoadingFooter
              : sections.length === 0
                ? NoOperationFooter
                : NoMoreOperationFooter
          }
          keyExtractor={this.keyExtractor}
          renderItem={this.renderItem}
          renderSectionHeader={SectionHeader}
          onEndReached={this.onEndReached}
          onScroll={this.onScroll}
          showsVerticalScrollIndicator={false}
        />
      </ScreenGeneric>
    );
  }
}

export default withCounterValuePolling(connect(mapStateToProps)(Dashboard));

const styles = StyleSheet.create({
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
  }
});
