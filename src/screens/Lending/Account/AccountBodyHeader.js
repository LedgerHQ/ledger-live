// @flow
import React, { useCallback } from "react";
import { View, StyleSheet, FlatList } from "react-native";
import type { TokenAccount, Account } from "@ledgerhq/live-common/lib/types";
import type { CompoundAccountSummary } from "@ledgerhq/live-common/lib/compound/types";
import { Trans } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import LText from "../../../components/LText";
import ActiveAccountRow from "../Dashboard/ActiveAccountRow";
import ClosedLoansRow from "../ClosedLoans/ClosedLoansRow";

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
  const { colors } = useTheme();
  const { closed, opened } = compoundSummary;

  const renderClosedRow = useCallback(
    // $FlowFixMe
    ({ item }) => <ClosedLoansRow item={{ ...item, account, parentAccount }} />,
    [account, parentAccount],
  );

  return opened.length > 0 || closed.length > 0 ? (
    <View style={styles.root}>
      {opened && opened.length > 0 ? (
        <>
          <LText semiBold style={styles.title}>
            <Trans i18nKey="transfer.lending.account.openLoans" />
          </LText>
          <View style={[styles.container, { backgroundColor: colors.white }]}>
            {opened.map((item, index) => (
              <ActiveAccountRow
                // $FlowFixMe
                item={{
                  ...item,
                  account,
                  parentAccount,
                  accruedInterests: item.interestsEarned,
                  totalSupplied: item.amountSupplied,
                }}
                key={`OpenLoans-${account.id}-${index}`}
              />
            ))}
          </View>
        </>
      ) : null}

      {closed.length > 0 && (
        <>
          <LText semiBold style={styles.title}>
            <Trans i18nKey="transfer.lending.account.closedLoans" />
          </LText>
          <FlatList
            style={[styles.container, { backgroundColor: colors.white }]}
            data={closed}
            renderItem={renderClosedRow}
            keyExtractor={(item, index) =>
              `ClosedLoans-${item.endDate.toDateString()}${index}`
            }
            ItemSeparatorComponent={() => (
              <View
                style={[
                  styles.separator,
                  { backgroundColor: colors.background },
                ]}
              />
            )}
          />
        </>
      )}
    </View>
  ) : null;
}

const styles = StyleSheet.create({
  root: {
    marginTop: 12,
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  container: {
    borderRadius: 4,
  },
  separator: {
    width: "100%",
    height: 1,
  },
  title: {
    paddingVertical: 16,
    lineHeight: 19,
    fontSize: 16,
  },
});
