// @flow
import React, { useRef, useState } from "react";
import { useSelector } from "react-redux";
import { View, StyleSheet, SectionList } from "react-native";
import SafeAreaView from "react-native-safe-area-view";
import Animated from "react-native-reanimated";
import { createNativeWrapper } from "react-native-gesture-handler";
import type { SectionBase } from "react-native/Libraries/Lists/SectionList";
import type { Operation } from "@ledgerhq/live-common/lib/types";
import {
  groupAccountsOperationsByDay,
  isAccountEmpty,
} from "@ledgerhq/live-common/lib/account";

import colors from "../../colors";

import {
  accountsSelector,
  flattenAccountsSelector,
} from "../../reducers/accounts";
import { counterValueCurrencySelector } from "../../reducers/settings";
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
import TrackScreen from "../../analytics/TrackScreen";
import NoOpStatePortfolio from "./NoOpStatePortfolio";
import NoOperationFooter from "../../components/NoOperationFooter";
import MigrateAccountsBanner from "../MigrateAccounts/Banner";
import RequireTerms from "../../components/RequireTerms";
import { useScrollToTop } from "../../navigation/utils";

export { default as PortfolioTabIcon } from "./TabIcon";

const AnimatedSectionList = createNativeWrapper(
  Animated.createAnimatedComponent(SectionList),
  {
    disallowInterruption: true,
    shouldCancelWhenOutside: false,
  },
);
const List = globalSyncRefreshControl(AnimatedSectionList);

type Props = {
  navigation: any,
};

export default function PortfolioScreen({ navigation }: Props) {
  const accounts = useSelector(accountsSelector);
  const allAccounts = useSelector(flattenAccountsSelector);
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const portfolio = useSelector(portfolioSelector);

  const [opCount, setOpCount] = useState(50);
  const scrollY = useRef(new Animated.Value(0)).current;
  const ref = useRef();
  useScrollToTop(ref);

  function keyExtractor(item: Operation) {
    return item.id;
  }

  function ListHeaderComponent() {
    return (
      <GraphCardContainer
        counterValueCurrency={counterValueCurrency}
        portfolio={portfolio}
        showGreeting={!accounts.every(isAccountEmpty)}
      />
    );
  }

  function ListEmptyComponent() {
    if (accounts.length === 0) {
      return <EmptyStatePortfolio navigation={navigation} />;
    }

    if (accounts.every(isAccountEmpty)) {
      return <NoOpStatePortfolio />;
    }

    return null;
  }

  function renderItem({
    item,
    index,
    section,
  }: {
    item: Operation,
    index: number,
    section: SectionBase<*>,
  }) {
    const account = allAccounts.find(a => a.id === item.accountId);
    const parentAccount =
      account && account.type !== "Account"
        ? accounts.find(a => a.id === account.parentId)
        : null;

    if (!account) return null;

    return (
      <OperationRow
        operation={item}
        parentAccount={parentAccount}
        account={account}
        multipleAccounts
        isLast={section.data.length - 1 === index}
      />
    );
  }

  function renderSectionHeader({ section }: { section: * }) {
    return <SectionHeader section={section} />;
  }

  function onEndReached() {
    setOpCount(opCount + 50);
  }

  const { sections, completed } = groupAccountsOperationsByDay(accounts, {
    count: opCount,
    withSubAccounts: true,
  });

  return (
    <SafeAreaView style={[styles.root, { paddingTop: extraStatusBarPadding }]}>
      <StickyHeader
        scrollY={scrollY}
        portfolio={portfolio}
        counterValueCurrency={counterValueCurrency}
      />

      <RequireTerms />

      <TrackScreen category="Portfolio" accountsLength={accounts.length} />

      <View style={styles.inner}>
        <List
          ref={ref}
          sections={sections}
          style={styles.list}
          contentContainerStyle={styles.contentContainer}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          onEndReached={onEndReached}
          stickySectionHeadersEnabled={false}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event([
            { nativeEvent: { contentOffset: { y: scrollY } } },
          ])}
          ListHeaderComponent={ListHeaderComponent}
          ListFooterComponent={
            !completed ? (
              <LoadingFooter />
            ) : accounts.every(isAccountEmpty) ? null : sections.length ? (
              <NoMoreOperationFooter />
            ) : (
              <NoOperationFooter />
            )
          }
          ListEmptyComponent={ListEmptyComponent}
        />
        <MigrateAccountsBanner />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.lightGrey,
  },
  inner: {
    position: "relative",
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
