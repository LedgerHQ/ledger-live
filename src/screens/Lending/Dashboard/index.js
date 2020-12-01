// @flow
import React from "react";
import { ScrollView, StyleSheet, SafeAreaView } from "react-native";
import { useTranslation } from "react-i18next";
import { listCurrentRates } from "@ledgerhq/live-common/lib/families/ethereum/modules/compound";
import { useCompoundSummaries } from "../useCompoundSummaries";
import { useFlattenSortAccounts } from "../../../actions/general";
import colors from "../../../colors";
import TrackScreen from "../../../analytics/TrackScreen";
import LText from "../../../components/LText";
import Rates from "./Rates";
import ActiveAccounts from "./ActiveAccounts";
import LendingWarnings from "../shared/LendingWarnings";

export default function Dashboard() {
  const { t } = useTranslation();
  const accounts = useFlattenSortAccounts();
  const summaries = useCompoundSummaries(accounts);
  const rates = listCurrentRates();

  return (
    <SafeAreaView style={[styles.root]}>
      <TrackScreen category="Lend" />
      <LendingWarnings />
      <ScrollView style={styles.body}>
        <LText style={styles.title} semiBold>
          {t("transfer.lending.dashboard.assetsTitle")}
        </LText>
        <Rates accounts={accounts} rates={rates} />
        <LText style={styles.title} semiBold>
          {t("transfer.lending.dashboard.accountsTitle")}
        </LText>
        <ActiveAccounts summaries={summaries} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.lightGrey,
  },
  body: {
    flex: 1,
    display: "flex",
    padding: 16,
    marginBottom: 16,
  },
  title: {
    paddingVertical: 16,
    lineHeight: 19,
    fontSize: 16,
  },
});
