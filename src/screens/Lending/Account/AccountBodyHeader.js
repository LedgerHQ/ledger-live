// @flow
import React, { useCallback } from "react";
import { View, StyleSheet, FlatList } from "react-native";
import type { TokenAccount, Account } from "@ledgerhq/live-common/lib/types";
import type { CompoundAccountSummary } from "@ledgerhq/live-common/lib/compound/types";
import { Trans } from "react-i18next";
import LText from "../../../components/LText";
import ActiveAccountRow from "../Dashboard/ActiveAccountRow";
import ClosedLoansRow from "../ClosedLoans/ClosedLoansRow";
import colors from "../../../colors";

type Props = {
  account: TokenAccount,
  parentAccount: Account,
  compoundSummary: CompoundAccountSummary,
};

export default function AccountBodyHeader({
  account,
  parentAccount,
  compoundSummary,
}: Props) {
  const { closed } = compoundSummary;

  const renderClosedRow = useCallback(
    // $FlowFixMe
    ({ item }) => <ClosedLoansRow item={{ ...item, account, parentAccount }} />,
    [account, parentAccount],
  );

  return (
    <View style={styles.root}>
      <LText semiBold style={styles.title}>
        <Trans i18nKey="transfer.lending.account.openLoans" />
      </LText>
      <View style={styles.container}>
        <ActiveAccountRow item={compoundSummary} />
      </View>

      {closed.length > 0 && (
        <>
          <LText semiBold style={styles.title}>
            <Trans i18nKey="transfer.lending.account.closedLoans" />
          </LText>
          <FlatList
            style={styles.container}
            data={closed}
            renderItem={renderClosedRow}
            keyExtractor={(item, index) =>
              `${item.endDate.toDateString()}${index}`
            }
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    marginTop: 12,
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  container: {
    backgroundColor: colors.white,
    borderRadius: 4,
  },
  separator: {
    width: "100%",
    height: 1,
    backgroundColor: colors.lightGrey,
  },
  title: {
    paddingVertical: 16,
    lineHeight: 19,
    fontSize: 16,
  },
});
