// @flow

import React, { Component } from "react";
import { compose } from "redux";
import { connect } from "react-redux";
import { View, StyleSheet, SectionList, Animated } from "react-native";
import type { SectionBase } from "react-native/Libraries/Lists/SectionList";
import { SafeAreaView } from "react-navigation";
import { translate } from "react-i18next";
import Config from "react-native-config";

import type { Account, Operation } from "@ledgerhq/live-common/lib/types";
import { groupAccountsOperationsByDay } from "@ledgerhq/live-common/lib/account";
import type AnimatedValue from "react-native/Libraries/Animated/src/nodes/AnimatedValue";

import colors from "../../colors";

import { accountsSelector } from "../../reducers/accounts";
import {
  hasCompletedOnboardingSelector,
  hasAcceptedTradingWarningSelector,
} from "../../reducers/settings";
import { acceptTradingWarning } from "../../actions/settings";
import SectionHeader from "../../components/SectionHeader";
import NoMoreOperationFooter from "../../components/NoMoreOperationFooter";
import LoadingFooter from "../../components/LoadingFooter";
import OperationRow from "../../components/OperationRow";
import globalSyncRefreshControl from "../../components/globalSyncRefreshControl";
import provideSummary from "../../components/provideSummary";

import type { Summary } from "../../components/provideSummary";

import GraphCardContainer from "./GraphCardContainer";
import StickyHeader from "./StickyHeader";
import EmptyStatePortfolio from "./EmptyStatePortfolio";
import extraStatusBarPadding from "../../logic/extraStatusBarPadding";
import { scrollToTopIntent } from "./events";
import SyncBackground from "../../bridge/SyncBackground";
import TradingDisclaimer from "../../modals/TradingDisclaimer";
import TrackScreen from "../../analytics/TrackScreen";
import NoOpStatePortfolio from "./NoOpStatePortfolio";

const AnimatedSectionList = Animated.createAnimatedComponent(SectionList);
const List = globalSyncRefreshControl(AnimatedSectionList);

const mapStateToProps = state => ({
  accounts: accountsSelector(state),
  hasCompletedOnboarding: hasCompletedOnboardingSelector(state),
  hasAcceptedTradingWarning: hasAcceptedTradingWarningSelector(state),
});

const mapDispatchToProps = {
  acceptTradingWarning,
};

class Portfolio extends Component<
  {
    acceptTradingWarning: () => void,
    accounts: Account[],
    summary: Summary,
    navigation: *,
    hasCompletedOnboarding: boolean,
    hasAcceptedTradingWarning: boolean,
  },
  {
    opCount: number,
    scrollY: AnimatedValue,
    isModalOpened: boolean,
  },
> {
  state = {
    opCount: 50,
    isModalOpened: !this.props.hasAcceptedTradingWarning,
    scrollY: new Animated.Value(0),
  };

  ref = React.createRef();

  scrollSub: *;

  componentDidMount() {
    if (!this.props.hasCompletedOnboarding && !Config.SKIP_ONBOARDING) {
      // TODO: there is probably more elegant way to do that
      this.props.navigation.navigate("Onboarding");
      return;
    }
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
    if (this.scrollSub) {
      this.scrollSub.unsubscribe();
    }
  }

  keyExtractor = (item: Operation) => item.id;

  ListHeaderComponent = () => {
    const { accounts } = this.props;
    const { opCount } = this.state;
    const { sections } = groupAccountsOperationsByDay(accounts, opCount);

    return (
      <GraphCardContainer
        summary={this.props.summary}
        showGreeting={!!sections.length}
      />
    );
  };

  ListFooterComponent = () => {
    const { accounts } = this.props;
    const { opCount } = this.state;
    const { sections, completed } = groupAccountsOperationsByDay(
      accounts,
      opCount,
    );

    return !completed ? (
      <LoadingFooter />
    ) : sections.length === 0 ? null : (
      <NoMoreOperationFooter />
    );
  };

  ListEmptyComponent = () => {
    const { accounts } = this.props;
    const { opCount } = this.state;
    const { sections } = groupAccountsOperationsByDay(accounts, opCount);
    const { navigation } = this.props;

    if (accounts.length && !sections.length) {
      return <NoOpStatePortfolio navigation={navigation} />;
    }
    return <EmptyStatePortfolio navigation={navigation} />;
  };

  renderItem = ({
    item,
    index,
    section,
  }: {
    item: Operation,
    index: number,
    section: SectionBase<*>,
  }) => {
    const account = this.props.accounts.find(a => a.id === item.accountId);

    if (!account) return null;

    return (
      <OperationRow
        operation={item}
        account={account}
        navigation={this.props.navigation}
        multipleAccounts
        isLast={section.data.length - 1 === index}
      />
    );
  };

  renderSectionHeader = ({ section }: { section: * }) => (
    <SectionHeader section={section} />
  );

  onEndReached = () => {
    this.setState(({ opCount }) => ({ opCount: opCount + 50 }));
  };

  onModalClose = () => {
    this.props.acceptTradingWarning();
    this.setState({ isModalOpened: false });
  };

  render() {
    const { summary, accounts, hasAcceptedTradingWarning } = this.props;
    const { opCount, scrollY, isModalOpened } = this.state;
    const disclaimer = !hasAcceptedTradingWarning && (
      <TradingDisclaimer isOpened={isModalOpened} onClose={this.onModalClose} />
    );

    const { sections } = groupAccountsOperationsByDay(accounts, opCount);

    return (
      <View style={[styles.root, { paddingTop: extraStatusBarPadding }]}>
        <StickyHeader scrollY={scrollY} summary={summary} />
        <SyncBackground />
        <TrackScreen category="Portfolio" accountsLength={accounts.length} />

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
            ListFooterComponent={this.ListFooterComponent}
            ListEmptyComponent={this.ListEmptyComponent}
          />
        </SafeAreaView>
        {disclaimer}
      </View>
    );
  }
}

export default compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  provideSummary,
  translate(),
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
    flexGrow: 1,
    paddingTop: 16,
    paddingBottom: 64,
  },
});
