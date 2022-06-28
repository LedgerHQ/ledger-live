import React, { useState, useRef, useCallback, useMemo } from "react";
import { StyleSheet, View, SectionList, FlatList } from "react-native";
import { SectionBase } from "react-native/Libraries/Lists/SectionList";
import Animated, { Value, event } from "react-native-reanimated";
import { useDispatch, useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import {
  isAccountEmpty,
  groupAccountOperationsByDay,
  getAccountCurrency,
} from "@ledgerhq/live-common/lib/account";
import {
  Account,
  AccountLike,
  TokenAccount,
  Operation,
} from "@ledgerhq/live-common/lib/types";
import debounce from "lodash/debounce";
import {
  getAccountCapabilities,
  makeCompoundSummaryForAccount,
} from "@ledgerhq/live-common/lib/compound/logic";
import { Trans } from "react-i18next";
import { Text } from "@ledgerhq/native-ui";
import { switchCountervalueFirst } from "../../actions/settings";
import { useBalanceHistoryWithCountervalue } from "../../actions/portfolio";
import {
  selectedTimeRangeSelector,
  counterValueCurrencySelector,
  countervalueFirstSelector,
} from "../../reducers/settings";
import { accountScreenSelector } from "../../reducers/accounts";
import { TrackScreen } from "../../analytics";
import accountSyncRefreshControl from "../../components/accountSyncRefreshControl";
import OperationRow from "../../components/OperationRow";
import SectionHeader from "../../components/SectionHeader";
import NoMoreOperationFooter from "../../components/NoMoreOperationFooter";
import LoadingFooter from "../../components/LoadingFooter";
import { ScreenName } from "../../const";
import EmptyStateAccount from "./EmptyStateAccount";
import NoOperationFooter from "../../components/NoOperationFooter";
import { useScrollToTop } from "../../navigation/utils";

import { getListHeaderComponents } from "./ListHeaderComponent";
import { withDiscreetMode } from "../../context/DiscreetModeContext";
import TabBarSafeAreaView, {
  TAB_BAR_SAFE_HEIGHT,
} from "../../components/TabBar/TabBarSafeAreaView";

type Props = {
  navigation: any;
  route: { params: RouteParams };
};

type RouteParams = {
  accountId: string;
  parentId?: string;
};

const AnimatedSectionList = Animated.createAnimatedComponent(SectionList);
const List = accountSyncRefreshControl(AnimatedSectionList);

const AnimatedFlatListWithRefreshControl = Animated.createAnimatedComponent(
  accountSyncRefreshControl(FlatList),
);

function renderSectionHeader({ section }: any) {
  return <SectionHeader section={section} />;
}

function keyExtractor(item: Operation) {
  return item.id;
}

const stickySectionHeight = 56;

function AccountScreen({ route }: Props) {
  const { account, parentAccount } = useSelector(accountScreenSelector(route));
  if (!account) return null;
  return <AccountScreenInner account={account} parentAccount={parentAccount} />;
}

const AccountScreenInner = ({
  account,
  parentAccount,
}: {
  account: AccountLike;
  parentAccount: Account | undefined;
}) => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const range = useSelector(selectedTimeRangeSelector);
  const {
    countervalueAvailable,
    countervalueChange,
    cryptoChange,
    history,
  } = useBalanceHistoryWithCountervalue({ account, range });
  const useCounterValue = useSelector(countervalueFirstSelector);
  const counterValueCurrency = useSelector(counterValueCurrencySelector);

  const [opCount, setOpCount] = useState(100);
  const ref = useRef();
  const scrollY = useRef(new Value(0)).current;

  useScrollToTop(ref);

  const onEndReached = useCallback(() => {
    setOpCount(opCount + 50);
  }, [setOpCount, opCount]);

  const onSwitchAccountCurrency = useCallback(() => {
    dispatch(switchCountervalueFirst());
  }, [dispatch]);

  const onAccountPress = debounce((tokenAccount: TokenAccount) => {
    navigation.push(ScreenName.Account, {
      parentId: account.id,
      accountId: tokenAccount.id,
    });
  }, 300);

  const ListEmptyComponent = useCallback(
    () =>
      isAccountEmpty(account) && (
        <EmptyStateAccount
          account={account}
          parentAccount={parentAccount}
          navigation={navigation}
        />
      ),
    [account, parentAccount, navigation],
  );

  const renderItem = useCallback(
    ({
      item,
      index,
      section,
    }: {
      item: Operation;
      index: number;
      section: SectionBase<any>;
    }) => {
      if (!account) return null;

      return (
        <OperationRow
          operation={item}
          account={account}
          parentAccount={parentAccount}
          isFirst={index === 0}
          isLast={section.data.length - 1 === index}
        />
      );
    },
    [account, parentAccount],
  );

  const currency = getAccountCurrency(account);

  const analytics = (
    <TrackScreen
      category="Account"
      currency={currency.id}
      operationsSize={account.operations.length}
    />
  );

  const { sections, completed } = groupAccountOperationsByDay(account, {
    count: opCount,
  });

  const compoundCapabilities: any =
    account.type === "TokenAccount" &&
    !!account.compoundBalance &&
    getAccountCapabilities(account);

  const compoundSummary =
    compoundCapabilities?.status && account.type === "TokenAccount"
      ? makeCompoundSummaryForAccount(account, parentAccount)
      : undefined;

  const [isCollapsed, setIsCollapsed] = useState(true);

  const { listHeaderComponents } = useMemo(
    () =>
      getListHeaderComponents({
        account,
        parentAccount,
        countervalueAvailable,
        useCounterValue,
        range,
        history,
        countervalueChange,
        cryptoChange,
        counterValueCurrency,
        onAccountPress,
        onSwitchAccountCurrency,
        compoundSummary,
        isCollapsed,
        setIsCollapsed,
      }),
    [
      account,
      compoundSummary,
      counterValueCurrency,
      countervalueAvailable,
      countervalueChange,
      cryptoChange,
      history,
      isCollapsed,
      onAccountPress,
      onSwitchAccountCurrency,
      parentAccount,
      range,
      useCounterValue,
    ],
  );

  const data = [
    ...listHeaderComponents,
    <List
      ref={ref}
      sections={sections}
      style={[styles.sectionList]}
      contentContainerStyle={styles.contentContainer}
      ListHeaderComponent={() => (
        <Text variant={"h3"} mt={8}>
          <Trans i18nKey="account.lastTransactions" />
        </Text>
      )}
      ListFooterComponent={
        !completed ? (
          <LoadingFooter />
        ) : sections.length === 0 ? (
          isAccountEmpty(account) ? null : (
            <NoOperationFooter />
          )
        ) : (
          <NoMoreOperationFooter />
        )
      }
      ListEmptyComponent={ListEmptyComponent}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      renderSectionHeader={renderSectionHeader}
      onEndReached={onEndReached}
      onScroll={event(
        [
          {
            nativeEvent: {
              contentOffset: { y: scrollY },
            },
          },
        ],
        { useNativeDriver: true },
      )}
      showsVerticalScrollIndicator={false}
      accountId={account.id}
      stickySectionHeadersEnabled={false}
    />,
  ];

  return (
    <TabBarSafeAreaView edges={["bottom", "left", "right"]}>
      {analytics}
      <AnimatedFlatListWithRefreshControl
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: TAB_BAR_SAFE_HEIGHT }}
        data={data}
        renderItem={({ item }: any) => item}
        keyExtractor={(_: any, index: any) => String(index)}
        showsVerticalScrollIndicator={false}
      />
    </TabBarSafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "column",
  },
  sectionList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  balanceContainer: {
    alignItems: "center",
    marginBottom: 10,
  },
  balanceText: {
    fontSize: 22,
    paddingBottom: 4,
  },
  contentContainer: {
    paddingBottom: 64,
    flexGrow: 1,
  },
  accountFabActions: {
    width: "100%",
    height: 56,
    position: "absolute",
    bottom: 0,
    left: 0,
  },
  stickyContainer: {
    width: "100%",
    height: stickySectionHeight,
    paddingVertical: 8,
    position: "absolute",
    left: 0,
    top: 0,
    zIndex: -100,
    opacity: 0,
  },
  stickyBg: {
    width: "100%",
    height: "100%",
    position: "absolute",
    zIndex: 0,
  },
});

export default withDiscreetMode(AccountScreen);
