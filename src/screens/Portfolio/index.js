// @flow

import React, { Component } from "react";
import { compose } from "redux";
import { connect } from "react-redux";
import {
  View,
  StyleSheet,
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
import PortfolioIcon from "../../icons/Portfolio";
import globalSyncRefreshControl from "../../components/globalSyncRefreshControl";
import provideSummary from "../../components/provideSummary";

import type { Summary } from "../../components/provideSummary";

import GraphCardContainer from "./GraphCardContainer";
import StickyHeader from "./StickyHeader";
import EmptyStatePortfolio from "./EmptyStatePortfolio";
import extraStatusBarPadding from "../../logic/extraStatusBarPadding";
import { scrollToTopIntent } from "./events";
import SyncBackground from "../../bridge/SyncBackground";
import defaultNavigationOptions from "../defaultNavigationOptions";

const AnimatedSectionList = Animated.createAnimatedComponent(SectionList);
const List = globalSyncRefreshControl(AnimatedSectionList);

const navigationOptions = {
  ...defaultNavigationOptions,
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
  },
> {
  static navigationOptions = navigationOptions;

  state = {
    opCount: 50,
    scrollY: new Animated.Value(0),
  };

  ref = React.createRef();

  scrollSub: *;

  componentDidMount() {
    this.scrollSub = scrollToTopIntent.subscribe(() => {
      const sectionList = this.ref.current && this.ref.current.getNode();
      if (sectionList) {
        sectionList.getScrollResponder().scrollTo({
          x: 0,
          y: 0,
          animated: true,
        });
      }
    });
  }

  componentWillUnmount() {
    this.scrollSub.unsubscribe();
  }

  keyExtractor = (item: Operation) => item.id;

  ListHeaderComponent = () => (
    <GraphCardContainer summary={this.props.summary} />
  );

  renderItem = ({ item }: { item: Operation }) => {
    const account = this.props.accounts.find(a => a.id === item.accountId);

    if (!account) return null;

    return (
      <OperationRow
        operation={item}
        account={account}
        navigation={this.props.navigation}
        multipleAccounts
      />
    );
  };

  renderSectionHeader = ({ section }: { section: * }) => (
    <SectionHeader section={section} />
  );

  onEndReached = () => {
    this.setState(({ opCount }) => ({ opCount: opCount + 50 }));
  };

  render() {
    const { summary, accounts, navigation } = this.props;
    const { opCount, scrollY } = this.state;

    if (accounts.length === 0) {
      return (
        <View style={styles.root}>
          <EmptyStatePortfolio navigation={navigation} />
        </View>
      );
    }

    const { sections, completed } = groupAccountsOperationsByDay(
      accounts,
      opCount,
    );

    return (
      <View style={[styles.root, { paddingTop: extraStatusBarPadding }]}>
        <StickyHeader scrollY={scrollY} summary={summary} />
        <SyncBackground />
        <SafeAreaView style={styles.inner}>
          <List
            forwardedRef={this.ref}
            sections={sections}
            style={styles.list}
            contentContainerStyle={styles.contentContainer}
            keyExtractor={this.keyExtractor}
            renderItem={this.renderItem}
            renderSectionHeader={this.renderSectionHeader}
            onEndReached={this.onEndReached}
            stickySectionHeadersEnabled={false}
            showsVerticalScrollIndicator={false}
            scrollEventThrottle={16}
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
        </SafeAreaView>
      </View>
    );
  }
}

export default compose(
  connect(mapStateToProps),
  provideSummary,
)(Portfolio);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.lightGrey,
  },
  inner: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 16,
    paddingBottom: 64,
  },
});
