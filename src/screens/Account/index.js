// @flow

import React, { useState, useRef, useCallback } from "react";
import { StyleSheet, View, Animated, SectionList } from "react-native";
import type { SectionBase } from "react-native/Libraries/Lists/SectionList";
import { useDispatch, useSelector } from "react-redux";
import { useNavigation, useTheme } from "@react-navigation/native";
import {
  isAccountEmpty,
  groupAccountOperationsByDay,
  getAccountCurrency,
} from "@ledgerhq/live-common/lib/account";
import type {
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

import ListHeaderComponent from "./ListHeaderComponent";

type Props = {
  navigation: any,
  route: { params: RouteParams },
};

type RouteParams = {
  accountId: string,
  parentId?: string,
};

const AnimatedSectionList = Animated.createAnimatedComponent(SectionList);
const List = accountSyncRefreshControl(AnimatedSectionList);

function renderSectionHeader({ section }: any) {
  return <SectionHeader section={section} />;
}

function keyExtractor(item: Operation) {
  return item.id;
}

export default function AccountScreen({ route }: Props) {
  const { account, parentAccount } = useSelector(accountScreenSelector(route));
  if (!account) return null;
  return <AccountScreenInner account={account} parentAccount={parentAccount} />;
}

function AccountScreenInner({
  account,
  parentAccount,
}: {
  account: AccountLike,
  parentAccount: ?Account,
}) {
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

  useScrollToTop(ref);

  const { colors } = useTheme();

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
      item: Operation,
      index: number,
      section: SectionBase<any>,
    }) => {
      if (!account) return null;

      return (
        <OperationRow
          operation={item}
          account={account}
          parentAccount={parentAccount}
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

  const compoundCapabilities =
    account.type === "TokenAccount" &&
    !!account.compoundBalance &&
    getAccountCapabilities(account);

  const compoundSummary =
    compoundCapabilities?.status && account.type === "TokenAccount"
      ? makeCompoundSummaryForAccount(account, parentAccount)
      : undefined;

  return (
    <View style={[styles.root]}>
      {analytics}
      <List
        ref={ref}
        sections={sections}
        style={[styles.sectionList, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.contentContainer}
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
        ListHeaderComponent={
          <ListHeaderComponent
            account={account}
            parentAccount={parentAccount}
            countervalueAvailable={countervalueAvailable}
            useCounterValue={useCounterValue}
            range={range}
            history={history}
            countervalueChange={countervalueChange}
            cryptoChange={cryptoChange}
            counterValueCurrency={counterValueCurrency}
            onAccountPress={onAccountPress}
            onSwitchAccountCurrency={onSwitchAccountCurrency}
            compoundSummary={compoundSummary}
          />
        }
        ListEmptyComponent={ListEmptyComponent}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        onEndReached={onEndReached}
        showsVerticalScrollIndicator={false}
        accountId={account.id}
        stickySectionHeadersEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: "column",
  },
  sectionList: {
    flex: 1,
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
});
