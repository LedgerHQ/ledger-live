// @flow
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { BigNumber } from "bignumber.js";
import { getAccountCurrency } from "@ledgerhq/live-common/lib/account";
import type { Account } from "@ledgerhq/live-common/lib/types";
import LText from "../LText";
import Row from "./Row";

export default function AccountDistribution({
  accounts,
}: {
  accounts: Account[],
}) {
  const { t } = useTranslation();
  const total = accounts.reduce(
    (total, a) => total.plus(a.balance),
    BigNumber(0),
  );
  const accountDistribution = useMemo(
    () =>
      accounts.map(a => ({
        account: a,
        currency: getAccountCurrency(a),
        distribution: a.balance.div(total).toNumber(),
        amount: a.balance,
      })),
    [accounts, total],
  );

  return (
    <View>
      <LText bold secondary style={styles.distributionTitle}>
        {t("distribution.listAccount", { count: accountDistribution.length })}
      </LText>
      {accountDistribution.map(item => (
        <View style={styles.root} key={item.account.id}>
          <Row item={item} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: 16,
  },
  distributionTitle: {
    fontSize: 16,
    lineHeight: 24,
    marginLeft: 16,
    marginTop: 8,
    marginBottom: 8,
  },
});
