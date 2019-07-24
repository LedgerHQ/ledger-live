// @flow

import React, { Component } from "react";
import { createStructuredSelector } from "reselect";
import { connect } from "react-redux";
import { View, StyleSheet, Animated } from "react-native";
import type { SectionBase } from "react-native/Libraries/Lists/SectionList";
import type {
  TokenAccount,
  Account,
  Operation,
  Portfolio,
  Currency,
} from "@ledgerhq/live-common/lib/types";
// $FlowFixMe
import { SectionList, SafeAreaView } from "react-navigation";
import { translate } from "react-i18next";
import {
  groupAccountsOperationsByDay,
  isAccountEmpty,
} from "@ledgerhq/live-common/lib/account";
import type AnimatedValue from "react-native/Libraries/Animated/src/nodes/AnimatedValue";

import colors from "../../colors";

import {
  accountsSelector,
  flattenAccountsSelector,
} from "../../reducers/accounts";
import {
  hasCompletedOnboardingSelector,
  hasAcceptedTradingWarningSelector,
  counterValueCurrencySelector,
} from "../../reducers/settings";
import { acceptTradingWarning } from "../../actions/settings";
import { portfolioSelector } from "../../actions/portfolio";
import SectionHeader from "../../components/SectionHeader";
import NoMoreOperationFooter from "../../components/NoMoreOperationFooter";
import LoadingFooter from "../../components/LoadingFooter";
import OperationRow from "../../components/OperationRow";
import globalSyncRefreshControl from "../../components/globalSyncRefreshControl";

import GraphCardContainer from "./GraphCardContainer";
import StickyHeader from "./StickyHeader";
import EmptyStatePortfolio from "./EmptyStatePortfolio";
import extraStatusBarPadding from "../../logic/extraStatusBarPadding";
import SyncBackground from "../../bridge/SyncBackground";
import TradingDisclaimer from "../../modals/TradingDisclaimer";
import TrackScreen from "../../analytics/TrackScreen";
import NoOpStatePortfolio from "./NoOpStatePortfolio";
import NoOperationFooter from "../../components/NoOperationFooter";

const AnimatedSectionList = Animated.createAnimatedComponent(SectionList);
const List = globalSyncRefreshControl(AnimatedSectionList);

const mapStateToProps = createStructuredSelector({
  accounts: accountsSelector,
  allAccounts: flattenAccountsSelector,
  hasCompletedOnboarding: hasCompletedOnboardingSelector,
  hasAcceptedTradingWarning: hasAcceptedTradingWarningSelector,
  counterValueCurrency: counterValueCurrencySelector,
  portfolio: portfolioSelector,
});

const mapDispatchToProps = {
  acceptTradingWarning,
};

class PortfolioScreen extends Component<
  {
    acceptTradingWarning: () => void,
    accounts: Account[],
    allAccounts: (Account | TokenAccount)[],
    portfolio: Portfolio,
    navigation: *,
    hasCompletedOnboarding: boolean,
    hasAcceptedTradingWarning: boolean,
    counterValueCurrency: Currency,
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

  keyExtractor = (item: Operation) => item.id;

  ListHeaderComponent = () => {
    const { accounts, counterValueCurrency } = this.props;

    return (
      <GraphCardContainer
        counterValueCurrency={counterValueCurrency}
        portfolio={this.props.portfolio}
        showGreeting={!accounts.every(isAccountEmpty)}
      />
    );
  };

  ListEmptyComponent = () => {
    const { accounts } = this.props;
    const { navigation } = this.props;

    if (accounts.length === 0) {
      return <EmptyStatePortfolio navigation={navigation} />;
    }

    if (accounts.every(isAccountEmpty)) {
      return <NoOpStatePortfolio navigation={navigation} />;
    }

    return null;
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
    const { allAccounts, accounts } = this.props;
    const account = allAccounts.find(a => a.id === item.accountId);
    const parentAccount =
      account && account.type === "TokenAccount"
        ? accounts.find(a => a.id === account.parentId)
        : null;

    if (!account) return null;

    return (
      <OperationRow
        operation={item}
        parentAccount={parentAccount}
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
    const {
      navigation,
      accounts,
      portfolio,
      counterValueCurrency,
      hasAcceptedTradingWarning,
    } = this.props;
    const { opCount, scrollY, isModalOpened } = this.state;
    const disclaimer = !hasAcceptedTradingWarning && (
      <TradingDisclaimer isOpened={isModalOpened} onClose={this.onModalClose} />
    );

    const { sections, completed } = groupAccountsOperationsByDay(accounts, {
      count: opCount,
      withTokenAccounts: true,
    });

    return (
      <View style={[styles.root, { paddingTop: extraStatusBarPadding }]}>
        <StickyHeader
          navigation={navigation}
          scrollY={scrollY}
          portfolio={portfolio}
          counterValueCurrency={counterValueCurrency}
        />
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
            ListFooterComponent={
              !completed ? (
                <LoadingFooter />
              ) : accounts.every(isAccountEmpty) ? null : sections.length ? (
                <NoMoreOperationFooter />
              ) : (
                <NoOperationFooter />
              )
            }
            ListEmptyComponent={this.ListEmptyComponent}
          />
        </SafeAreaView>
        {disclaimer}
      </View>
    );
  }
}

export default translate()(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  )(PortfolioScreen),
);

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
