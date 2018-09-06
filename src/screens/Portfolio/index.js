// @flow

import React, { Component } from "react";
import { compose } from "redux";
import { connect } from "react-redux";
import {
  View,
  StyleSheet,
  StatusBar,
  SectionList,
  Animated,
  SafeAreaView,
} from "react-native";

import type { Account, Operation } from "@ledgerhq/live-common/lib/types";
import { groupAccountsOperationsByDay } from "@ledgerhq/live-common/lib/helpers/account";
import type AnimatedValue from "react-native/Libraries/Animated/src/nodes/AnimatedValue";

import colors from "../../colors";

import { accountsSelector } from "../../reducers/accounts";

import SectionHeader from "../../components/SectionHeader";
import NoMoreOperationFooter from "../../components/NoMoreOperationFooter";
import NoOperationFooter from "../../components/NoOperationFooter";
import LoadingFooter from "../../components/LoadingFooter";
import OperationRow from "../../components/OperationRow";
import LText from "../../components/LText";
import PortfolioIcon from "../../images/icons/Portfolio";
import provideSyncRefreshControl from "../../components/provideSyncRefreshControl";
import provideSummary from "../../components/provideSummary";

import type { Summary } from "../../components/provideSummary";

import GraphCard from "../../components/GraphCard";
import AnimatedTopBar from "./AnimatedTopBar";
import Greetings from "./Greetings";

const AnimatedSectionList = Animated.createAnimatedComponent(SectionList);
const List = provideSyncRefreshControl(AnimatedSectionList);

const navigationOptions = {
  tabBarIcon: ({ tintColor }: *) => (
    <PortfolioIcon size={18} color={tintColor} />
  ),
};

const mapStateToProps = state => ({
  accounts: accountsSelector(state),
});

class Portfolio extends Component<
  {
    accounts: Account[],
    summary: Summary,
    navigation: *,
  },
  {
    opCount: number,
    scrollY: AnimatedValue,
    scrollEnabled: boolean,
  },
> {
  static navigationOptions = navigationOptions;

  state = {
    opCount: 50,
    scrollY: new Animated.Value(0),
    scrollEnabled: true,
  };

  keyExtractor = (item: Operation) => item.id;

  disableScroll = () => this.setState({ scrollEnabled: false });
  enableScroll = () => this.setState({ scrollEnabled: true });

  ListHeaderComponent = () => (
    <GraphCardContainer
      summary={this.props.summary}
      onPanResponderStart={this.disableScroll}
      onPanResponderRelease={this.enableScroll}
    />
  );

  renderItem = ({ item }: { item: Operation }) => {
    const account = this.props.accounts.find(a => a.id === item.accountId);

    if (!account) return null;

    return (
      <OperationRow
        operation={item}
        account={account}
        navigation={this.props.navigation}
      />
    );
  };

  onEndReached = () => {
    this.setState(({ opCount }) => ({ opCount: opCount + 50 }));
  };

  render() {
    const { accounts, summary } = this.props;
    const { opCount, scrollY, scrollEnabled } = this.state;

    if (accounts.length === 0) {
      return (
        <View style={styles.root}>
          <LText>No account</LText>
        </View>
      );
    }

    const { sections, completed } = groupAccountsOperationsByDay(
      accounts,
      opCount,
    );

    // TODO pull to refresh connected to bridge (need to think it modular so we can reuse easily)

    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="dark-content" />
        <List
          sections={sections}
          style={styles.sectionList}
          keyExtractor={this.keyExtractor}
          renderItem={this.renderItem}
          renderSectionHeader={SectionHeader}
          onEndReached={this.onEndReached}
          showsVerticalScrollIndicator
          scrollEventThrottle={16}
          scrollEnabled={scrollEnabled}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true },
          )}
          ListHeaderComponent={this.ListHeaderComponent}
          ListFooterComponent={
            !completed
              ? LoadingFooter
              : sections.length === 0
                ? NoOperationFooter
                : NoMoreOperationFooter
          }
        />
        <AnimatedTopBar scrollY={scrollY} summary={summary} />
      </SafeAreaView>
    );
  }
}

const GraphCardContainer = ({
  summary,
  onPanResponderStart,
  onPanResponderRelease,
}: {
  summary: Summary,
  onPanResponderStart: () => *,
  onPanResponderRelease: () => *,
}) => (
  <View>
    <Greetings nbAccounts={summary.accounts.length} />
    <GraphCard
      summary={summary}
      onPanResponderStart={onPanResponderStart}
      onPanResponderRelease={onPanResponderRelease}
    />
  </View>
);

export default compose(
  connect(mapStateToProps),
  provideSummary,
)(Portfolio);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.lightGrey,
  },
  sectionList: {
    flex: 1,
  },
  graphCardContainer: {
    padding: 20,
  },
});
