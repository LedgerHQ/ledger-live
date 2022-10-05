import React, { useCallback, useMemo, useState } from "react";
import { SectionList, View, StyleSheet, SafeAreaView } from "react-native";
import { useTranslation } from "react-i18next";
import { useNavigation, useTheme } from "@react-navigation/native";
import type {
  Account,
  AccountLikeArray,
  DailyOperationsSection,
  Operation,
} from "@ledgerhq/types-live";
import { groupAccountsOperationsByDay } from "@ledgerhq/live-common/account/index";
import { ScreenName } from "../../../const";
import { useFlattenSortAccounts } from "../../../actions/general";
import TrackScreen from "../../../analytics/TrackScreen";
import EmptyState from "../shared/EmptyState";
import OperationRow from "../../../components/OperationRow";
import SectionHeader from "../../../components/SectionHeader";
import NoMoreOperationFooter from "../../../components/NoMoreOperationFooter";
import LoadingFooter from "../../../components/LoadingFooter";
import { StackNavigatorNavigation } from "../../../components/RootNavigator/types/helpers";
import { LendingNavigatorParamList } from "../../../components/RootNavigator/types/LendingNavigator";

const useCompoundHistory = (accounts: AccountLikeArray): AccountLikeArray => {
  const filterOps = (op: Operation): boolean =>
    ["REDEEM", "SUPPLY"].includes(op.type);

  const history = useMemo(
    () =>
      accounts.map(acc => {
        const operations = acc.operations.filter(filterOps);
        return { ...acc, operations };
      }),
    [accounts],
  );

  return history;
};

function keyExtractor(item: Operation) {
  return item.id;
}

export default function History() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const accounts = useFlattenSortAccounts();
  const history = useCompoundHistory(accounts);
  const [opCount, setOpCount] = useState(50);
  const onEndReached = useCallback(() => setOpCount(opCount + 50), [opCount]);
  const { sections, completed } = groupAccountsOperationsByDay(history, {
    count: opCount,
    withSubAccounts: false,
  });
  const navigation =
    useNavigation<
      StackNavigatorNavigation<
        LendingNavigatorParamList,
        ScreenName.LendingHistory
      >
    >();
  const navigateToCompoundDashboard = useCallback(() => {
    navigation.navigate(ScreenName.LendingDashboard);
  }, [navigation]);
  return (
    <SafeAreaView
      style={[
        styles.root,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <TrackScreen category="Lend" name="History" />
      <View style={styles.body}>
        {/** $FlowFixMe */}
        <SectionList
          sections={sections}
          renderSectionHeader={({
            section,
          }: {
            section: DailyOperationsSection;
          }) => <SectionHeader section={section} />}
          renderItem={({
            item,
            index,
            section,
          }: {
            item: Operation;
            index: number;
            section: DailyOperationsSection;
          }) => {
            const account = accounts.find(a => a.id === item.accountId);
            const parentAccount: Account | null | undefined =
              account && account.type !== "Account"
                ? (accounts.find(a => a.id === account.parentId) as Account)
                : null;
            if (!account) return null;
            return (
              <OperationRow
                operation={item}
                account={account}
                parentAccount={parentAccount}
                isLast={section.data.length - 1 === index}
              />
            );
          }}
          keyExtractor={keyExtractor}
          stickySectionHeadersEnabled={false}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <EmptyState
              title={t("transfer.lending.history.tabTitle")}
              description={t("transfer.lending.history.description")}
              buttonLabel={t("transfer.lending.history.cta")}
              onClick={navigateToCompoundDashboard}
            />
          )}
          ListFooterComponent={
            !completed ? (
              <LoadingFooter />
            ) : sections.length ? (
              <NoMoreOperationFooter />
            ) : null
          }
          onEndReached={onEndReached}
        />
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  body: {
    flex: 1,
    display: "flex",
    alignItems: "stretch",
    justifyContent: "flex-start",
    padding: 16,
  },
});
