// @flow
import React, { useRef, useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import { StyleSheet, FlatList, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { interpolateNode } from "react-native-reanimated";
import { createNativeWrapper } from "react-native-gesture-handler";
import { useTranslation } from "react-i18next";
import { useFocusEffect, useTheme } from "@react-navigation/native";
import { isAccountEmpty } from "@ledgerhq/live-common/lib/account";

import {
  useRefreshAccountsOrdering,
  useDistribution,
} from "../../actions/general";
import { accountsSelector } from "../../reducers/accounts";
import { counterValueCurrencySelector } from "../../reducers/settings";
import { usePortfolio } from "../../actions/portfolio";
import globalSyncRefreshControl from "../../components/globalSyncRefreshControl";

import GraphCardContainer from "./GraphCardContainer";
import { DistributionList } from "../Distribution";
import Carousel from "../../components/Carousel";
import Button from "../../components/Button";
import StickyHeader from "./StickyHeader";
import Header from "./Header";
import extraStatusBarPadding from "../../logic/extraStatusBarPadding";
import TrackScreen from "../../analytics/TrackScreen";
import MigrateAccountsBanner from "../MigrateAccounts/Banner";
import RequireTerms from "../../components/RequireTerms";
import { useScrollToTop } from "../../navigation/utils";
import { ScreenName } from "../../const";
import { PortfolioHistoryList } from "./PortfolioHistory";

import FabActions from "../../components/FabActions";
import LText from "../../components/LText";
import FirmwareUpdateBanner from "../../components/FirmwareUpdateBanner";
import CheckLanguageAvailability from "../../components/CheckLanguageAvailability";

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
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const portfolio = usePortfolio();
  const { t } = useTranslation();

  const refreshAccountsOrdering = useRefreshAccountsOrdering();
  useFocusEffect(refreshAccountsOrdering);

  const scrollY = useRef(new Animated.Value(0)).current;
  const ref = useRef();
  useScrollToTop(ref);
  const { colors } = useTheme();

  const StickyActions = useCallback(() => {
    const offset = 410;
    const top = interpolateNode(scrollY, {
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
  }, [accounts.length, scrollY]);

  const showingPlaceholder =
    accounts.length === 0 || accounts.every(isAccountEmpty);

  const areAccountsEmpty = useMemo(() => accounts.every(isAccountEmpty), [
    accounts,
  ]);

  const showDistribution =
    portfolio.balanceHistory[portfolio.balanceHistory.length - 1].value > 0;

  const flatListRef = useRef();
  let distribution = useDistribution();
  const maxDistributionToDisplay = 3;
  distribution = {
    ...distribution,
    list: distribution.list.slice(0, maxDistributionToDisplay),
  };
  const onDistributionButtonPress = useCallback(() => {
    navigation.navigate(ScreenName.Distribution);
  }, [navigation]);

  const onDistributionCardPress = useCallback(
    (i, item) =>
      navigation.navigate(ScreenName.Asset, {
        currency: item.currency,
      }),
    [navigation],
  );

  const data = useMemo(
    () => [
      accounts.length > 0 && !areAccountsEmpty ? <Carousel /> : null,
      <GraphCardContainer
        counterValueCurrency={counterValueCurrency}
        portfolio={portfolio}
        showGreeting={!areAccountsEmpty}
        showGraphCard={!areAccountsEmpty}
      />,
      StickyActions(),
      ...(showDistribution
        ? [
            <View style={styles.distrib}>
              <LText bold secondary style={styles.distributionTitle}>
                {t("distribution.header")}
              </LText>
              <DistributionList
                flatListRef={flatListRef}
                distribution={distribution}
                setHighlight={onDistributionCardPress}
              />
              <View style={styles.seeMoreBtn}>
                <Button
                  event="View Distribution"
                  type="lightPrimary"
                  title={t("common.seeAll")}
                  onPress={onDistributionButtonPress}
                />
              </View>
            </View>,
          ]
        : []),
      <PortfolioHistoryList navigation={navigation} />,
    ],
    [
      StickyActions,
      accounts.length,
      areAccountsEmpty,
      counterValueCurrency,
      distribution,
      navigation,
      onDistributionButtonPress,
      onDistributionCardPress,
      portfolio,
      showDistribution,
      t,
    ],
  );

  return (
    <>
      <FirmwareUpdateBanner />
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
        <CheckLanguageAvailability />

        <TrackScreen category="Portfolio" accountsLength={accounts.length} />

        {areAccountsEmpty && <Header />}

        <AnimatedFlatListWithRefreshControl
          ref={ref}
          data={data}
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
    </>
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
  distrib: {
    marginTop: -56,
  },
  list: {
    flex: 1,
  },
  distributionTitle: {
    fontSize: 16,
    lineHeight: 24,
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  stickyActions: {
    height: 110,
    width: "100%",
    alignContent: "flex-start",
    justifyContent: "flex-start",
  },
  styckyActionsInner: { height: 56 },
  seeMoreBtn: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 32,
  },
});
