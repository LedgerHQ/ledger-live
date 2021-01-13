// @flow
import React, { useCallback } from "react";
import { View, StyleSheet, FlatList, SafeAreaView } from "react-native";
import { useTranslation } from "react-i18next";
import { useNavigation, useTheme } from "@react-navigation/native";
import { makeClosedHistoryForAccounts } from "@ledgerhq/live-common/lib/compound/logic";

import { useCompoundSummaries } from "../useCompoundSummaries";
import { useFlattenSortAccounts } from "../../../actions/general";
import TrackScreen from "../../../analytics/TrackScreen";
import EmptyState from "../shared/EmptyState";
import { ScreenName } from "../../../const";
import ClosedLoansRow from "./ClosedLoansRow";

export default function ClosedLoans() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const accounts = useFlattenSortAccounts();
  const summaries = useCompoundSummaries(accounts);
  const closedLoans = makeClosedHistoryForAccounts(summaries);
  const navigation = useNavigation();

  const navigateToCompoundDashboard = useCallback(() => {
    navigation.navigate(ScreenName.LendingDashboard);
  }, [navigation]);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <TrackScreen category="Lend" name="Closed Positions" />
      <View style={styles.body}>
        <View style={[styles.rows, { backgroundColor: colors.card }]}>
          <FlatList
            data={closedLoans}
            renderItem={({ item }) => <ClosedLoansRow item={item} />}
            keyExtractor={(item, index) =>
              `${item.endDate.toDateString()}${index}`
            }
            ItemSeparatorComponent={() => (
              <View
                style={[
                  styles.separator,
                  { backgroundColor: colors.background },
                ]}
              />
            )}
            ListEmptyComponent={() => (
              <EmptyState
                title={t("transfer.lending.closedLoans.tabTitle")}
                description={t("transfer.lending.closedLoans.description")}
                buttonLabel={t("transfer.lending.closedLoans.cta")}
                onClick={navigateToCompoundDashboard}
              />
            )}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  rows: {
    borderRadius: 4,
  },
  separator: {
    width: "100%",
    height: 1,
  },
  body: {
    flex: 1,
    display: "flex",
    alignItems: "stretch",
    justifyContent: "flex-start",
    padding: 16,
  },
});
