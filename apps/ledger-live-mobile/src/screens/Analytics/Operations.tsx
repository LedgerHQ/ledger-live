import React, { memo, useMemo, useState, useCallback } from "react";
import { SectionList, SectionListData, SectionListRenderItem } from "react-native";
import { Flex } from "@ledgerhq/native-ui";
import { useSelector } from "react-redux";
import { useFocusEffect } from "@react-navigation/native";
import {
  Account,
  AccountLike,
  AccountLikeArray,
  DailyOperationsSection,
  Operation,
} from "@ledgerhq/types-live";
import { groupAccountsOperationsByDay } from "@ledgerhq/live-common/account/index";
import { isAccountEmpty } from "@ledgerhq/live-common/account/helpers";

import { Trans } from "react-i18next";
import { isAddressPoisoningOperation } from "@ledgerhq/live-common/operation";
import { useRefreshAccountsOrdering } from "~/actions/general";
import { flattenAccountsSelector } from "~/reducers/accounts";

import NoOperationFooter from "~/components/NoOperationFooter";
import NoMoreOperationFooter from "~/components/NoMoreOperationFooter";

import EmptyStatePortfolio from "../Portfolio/EmptyStatePortfolio";
import NoOpStatePortfolio from "../Portfolio/NoOpStatePortfolio";
import OperationRow from "~/components/OperationRow";
import SectionHeader from "~/components/SectionHeader";
import LoadingFooter from "~/components/LoadingFooter";
import Button from "~/components/Button";
import { ScreenName } from "~/const";
import { TrackScreen } from "~/analytics";
import { withDiscreetMode } from "~/context/DiscreetModeContext";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { filterTokenOperationsZeroAmountEnabledSelector } from "~/reducers/settings";

type Props = StackNavigatorProps<BaseNavigatorStackParamList, ScreenName.AnalyticsOperations>;

export function Operations({ navigation, route }: Props) {
  const accountsIds = route?.params?.accountsIds;
  const [opCount, setOpCount] = useState(50);

  function onEndReached() {
    setOpCount(opCount + 50);
  }

  const accountsFromState = useSelector(flattenAccountsSelector);
  const accountsFiltered = useMemo(
    () =>
      accountsIds
        ? accountsFromState.filter(account => accountsIds.includes(account.id))
        : accountsFromState,
    [accountsFromState, accountsIds],
  );
  const allAccounts: AccountLikeArray = useSelector(flattenAccountsSelector);

  const refreshAccountsOrdering = useRefreshAccountsOrdering();
  useFocusEffect(refreshAccountsOrdering);

  const shouldFilterTokenOpsZeroAmount = useSelector(
    filterTokenOperationsZeroAmountEnabledSelector,
  );
  const filterOperation = useCallback(
    (operation: Operation, account: AccountLike) => {
      // Remove operations linked to address poisoning
      const removeZeroAmountTokenOp =
        shouldFilterTokenOpsZeroAmount && isAddressPoisoningOperation(operation, account);

      return !removeZeroAmountTokenOp;
    },
    [shouldFilterTokenOpsZeroAmount],
  );
  const { sections, completed } = groupAccountsOperationsByDay(accountsFiltered, {
    count: opCount,
    withSubAccounts: true,
    filterOperation,
  });

  function ListEmptyComponent() {
    if (accountsFiltered.length === 0) {
      return <EmptyStatePortfolio />;
    }

    if (accountsFiltered.every(isAccountEmpty)) {
      return <NoOpStatePortfolio />;
    }

    return null;
  }

  function keyExtractor(item: Operation) {
    return item.id;
  }

  const renderItem: SectionListRenderItem<Operation, DailyOperationsSection> = ({
    item,
    index,
    section,
  }) => {
    const account = allAccounts.find(a => a.id === item.accountId);
    const parentAccount =
      account && account.type !== "Account"
        ? (allAccounts.find(a => a.id === account.parentId) as Account)
        : null;

    if (!account) return null;

    return (
      <OperationRow
        operation={item}
        parentAccount={parentAccount}
        account={account}
        multipleAccounts={accountsFiltered.length > 1}
        isLast={section.data.length - 1 === index}
      />
    );
  };

  function renderSectionHeader({
    section,
  }: {
    section: SectionListData<Operation, DailyOperationsSection>;
  }) {
    return <SectionHeader day={section.day} />;
  }

  const onTransactionButtonPress = useCallback(() => {
    navigation.navigate(ScreenName.PortfolioOperationHistory);
  }, [navigation]);

  return (
    <Flex flex={1} px={4}>
      <SectionList
        sections={sections}
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        stickySectionHeadersEnabled={false}
        onEndReached={onEndReached}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={
          !completed ? (
            !onEndReached ? (
              <Flex m={8}>
                <Button
                  event="View Transactions"
                  type="lightPrimary"
                  title={<Trans i18nKey="common.seeAll" />}
                  onPress={onTransactionButtonPress}
                />
              </Flex>
            ) : (
              <LoadingFooter />
            )
          ) : accountsFiltered.every(isAccountEmpty) ? null : sections.length ? (
            <NoMoreOperationFooter />
          ) : (
            <NoOperationFooter />
          )
        }
        ListEmptyComponent={ListEmptyComponent}
      />
      <TrackScreen category="Analytics" name="Operations" />
    </Flex>
  );
}

export default withDiscreetMode(memo<Props>(Operations));
