// @flow
import React, { useRef, useState, useMemo } from "react";
import { useSelector } from "react-redux";
import {
  StyleSheet,
  SectionList,
  FlatList,
  SafeAreaView,
  View,
} from "react-native";
import Animated, { interpolate } from "react-native-reanimated";
import { createNativeWrapper } from "react-native-gesture-handler";
import type { SectionBase } from "react-native/Libraries/Lists/SectionList";
import type { Operation } from "@ledgerhq/live-common/lib/types";
import { useFocusEffect, useTheme } from "@react-navigation/native";
import {
  groupAccountsOperationsByDay,
  isAccountEmpty,
} from "@ledgerhq/live-common/lib/account";

import { useRefreshAccountsOrdering } from "../../actions/general";
import {
  accountsSelector,
  flattenAccountsSelector,
} from "../../reducers/accounts";
import { counterValueCurrencySelector } from "../../reducers/settings";
import { usePortfolio } from "../../actions/portfolio";
import SectionHeader from "../../components/SectionHeader";
import NoMoreOperationFooter from "../../components/NoMoreOperationFooter";
import LoadingFooter from "../../components/LoadingFooter";
import OperationRow from "../../components/OperationRow";
import globalSyncRefreshControl from "../../components/globalSyncRefreshControl";

import GraphCardContainer from "./GraphCardContainer";
import Carousel from "../../components/Carousel";
import StickyHeader from "./StickyHeader";
import EmptyStatePortfolio from "./EmptyStatePortfolio";
import Header from "./Header";
import extraStatusBarPadding from "../../logic/extraStatusBarPadding";
import TrackScreen from "../../analytics/TrackScreen";
import NoOpStatePortfolio from "./NoOpStatePortfolio";
import NoOperationFooter from "../../components/NoOperationFooter";
import MigrateAccountsBanner from "../MigrateAccounts/Banner";
import RequireTerms from "../../components/RequireTerms";
import { useScrollToTop } from "../../navigation/utils";

import FabActions from "../../components/FabActions";

export { default as PortfolioTabIcon } from "./TabIcon";

const AnimatedFlatListWithRefreshControl = createNativeWrapper(
  Animated.createAnimatedComponent(globalSyncRefreshControl(FlatList)),
  {
    disallowInterruption: true,
    shouldCancelWhenOutside: false,
  },
);
type Props = {
  navigation: any,
};

export default function PortfolioScreen({ navigation }: Props) {
  const accounts = useSelector(accountsSelector);
  const allAccounts = useSelector(flattenAccountsSelector);
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const portfolio = usePortfolio();

  const refreshAccountsOrdering = useRefreshAccountsOrdering();
  useFocusEffect(refreshAccountsOrdering);

  const [opCount, setOpCount] = useState(50);
  const scrollY = useRef(new Animated.Value(0)).current;
  const ref = useRef();
  useScrollToTop(ref);
  const { colors } = useTheme();

  function keyExtractor(item: Operation) {
    return item.id;
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

  function StickyActions() {
    const offset = 410;
    const top = interpolate(scrollY, {
      inputRange: [offset, offset + 56],
      outputRange: [0, 56],
      extrapolate: "clamp",
    });

    return accounts.length === 0 ? null : (
      <View style={[styles.stickyActions]}>
        <Animated.View
          style={[
            styles.styckyActionsInner,
            { transform: [{ translateY: top }] },
          ]}
        >
          <FabActions />
        </Animated.View>
      </View>
    );
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

  function renderSectionHeader({ section }: { section: { day: Date } }) {
    return <SectionHeader section={section} />;
  }

  function onEndReached() {
    setOpCount(opCount + 50);
  }

  const { sections, completed } = groupAccountsOperationsByDay(accounts, {
    count: opCount,
    withSubAccounts: true,
  });

  const areAccountsEmpty = useMemo(() => accounts.every(isAccountEmpty), [
    accounts,
  ]);
  const showingPlaceholder = accounts.length === 0 || areAccountsEmpty;

  return (
    <SafeAreaView
      style={[
        styles.root,
        {
          paddingTop: extraStatusBarPadding,
          backgroundColor: colors.background,
        },
      ]}
    >
      {!showingPlaceholder ? (
        <StickyHeader
          scrollY={scrollY}
          portfolio={portfolio}
          counterValueCurrency={counterValueCurrency}
        />
      ) : null}

      <RequireTerms />

      <TrackScreen category="Portfolio" accountsLength={accounts.length} />

      {areAccountsEmpty && <Header nbAccounts={portfolio.accounts.length} />}

      <AnimatedFlatListWithRefreshControl
        ref={ref}
        data={[
          accounts.length > 0 && !areAccountsEmpty ? <Carousel /> : null,
          <GraphCardContainer
            counterValueCurrency={counterValueCurrency}
            portfolio={portfolio}
            showGreeting={!areAccountsEmpty}
            showGraphCard={!areAccountsEmpty}
          />,
          StickyActions(),
          <SectionList
            // $FlowFixMe
            sections={sections}
            style={styles.list}
            contentContainerStyle={styles.contentContainer}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            // $FlowFixMe
            renderSectionHeader={renderSectionHeader}
            onEndReached={onEndReached}
            stickySectionHeadersEnabled={false}
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
          />,
        ]}
        style={styles.inner}
        renderItem={({ item }) => item}
        keyExtractor={(item, index) => String(index)}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[2]}
        onScroll={Animated.event(
          [
            {
              nativeEvent: {
                contentOffset: { y: scrollY },
              },
            },
          ],
          { useNativeDriver: true },
        )}
        testID={
          accounts.length ? "PortfolioAccountsList" : "PortfolioEmptyAccount"
        }
      />
      <MigrateAccountsBanner />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  inner: {
    position: "relative",
    flex: 1,
  },
  list: {
    flex: 1,
    marginTop: -56,
  },
  contentContainer: {
    flexGrow: 1,
    paddingTop: 16,
    paddingBottom: 64,
  },
  stickyActions: {
    height: 110,
    width: "100%",
    alignContent: "flex-start",
    justifyContent: "flex-start",
  },
  styckyActionsInner: { height: 56 },
});
