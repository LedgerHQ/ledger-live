import React, { memo, useState, useCallback } from "react";
import { SectionList, SectionListData, SectionListRenderItemInfo } from "react-native";
import { useSelector } from "react-redux";
import { useFocusEffect } from "@react-navigation/native";
import type { DailyOperationsSection, Operation } from "@ledgerhq/types-live";
import { groupAccountsOperationsByDay } from "@ledgerhq/live-common/account/index";
import { isAccountEmpty } from "@ledgerhq/live-common/account/helpers";

import { Trans } from "react-i18next";
import { useRefreshAccountsOrdering } from "~/actions/general";
import { accountsSelector, flattenAccountsSelector } from "~/reducers/accounts";

import NoMoreOperationFooter from "~/components/NoMoreOperationFooter";
import OperationRow from "~/components/OperationRow";
import SectionHeader from "~/components/SectionHeader";
import LoadingFooter from "~/components/LoadingFooter";
import Button from "~/components/Button";
import { ScreenName } from "~/const";
import { withDiscreetMode } from "~/context/DiscreetModeContext";
import { track } from "~/analytics";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";

type Props = StackNavigatorProps<BaseNavigatorStackParamList, ScreenName.PortfolioOperationHistory>;

export const PortfolioHistoryList = withDiscreetMode(
  ({
    onEndReached,
    opCount = 5,
    navigation,
  }: {
    onEndReached?: () => void;
    opCount?: number;
    navigation: Props["navigation"];
  }) => {
    const accounts = useSelector(accountsSelector);
    const allAccounts = useSelector(flattenAccountsSelector);

    const refreshAccountsOrdering = useRefreshAccountsOrdering();
    useFocusEffect(refreshAccountsOrdering);

    const { sections, completed } = groupAccountsOperationsByDay(accounts, {
      count: opCount,
      withSubAccounts: true,
    });

    function ListEmptyComponent() {
      return null;
    }

    function keyExtractor(item: Operation) {
      return item.id;
    }

    function renderItem({ item, index, section }: SectionListRenderItemInfo<Operation>) {
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

    function renderSectionHeader({
      section,
    }: {
      section: SectionListData<Operation, DailyOperationsSection>;
    }) {
      return <SectionHeader day={section.day} />;
    }

    const onTransactionButtonPress = useCallback(() => {
      track("button_clicked", {
        button: "See All Transactions",
      });
      navigation.navigate(ScreenName.PortfolioOperationHistory);
    }, [navigation]);

    return (
      <SectionList
        sections={sections}
        style={{ flex: 1, paddingHorizontal: 16 }}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        stickySectionHeadersEnabled={false}
        onEndReached={onEndReached}
        ListFooterComponent={
          !completed ? (
            !onEndReached ? (
              <Button
                event="View Transactions"
                type="main"
                mt={6}
                title={<Trans i18nKey="common.seeAll" />}
                onPress={onTransactionButtonPress}
              />
            ) : (
              <LoadingFooter />
            )
          ) : accounts.every(isAccountEmpty) ? null : sections.length ? (
            <NoMoreOperationFooter />
          ) : null
        }
        ListEmptyComponent={ListEmptyComponent}
      />
    );
  },
);

function PortfolioHistory({ navigation }: Props) {
  const [opCount, setOpCount] = useState(50);

  function onEndReached() {
    setOpCount(opCount + 50);
  }

  return (
    <PortfolioHistoryList navigation={navigation} opCount={opCount} onEndReached={onEndReached} />
  );
}

export default memo<Props>(PortfolioHistory);
