// @flow

import { getAccountCurrency } from "@ledgerhq/live-common/lib/account";
import type { Currency } from "@ledgerhq/live-common/lib/types";
import React from "react";
import { Trans } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { BigNumber } from "bignumber.js";
import { connect } from "react-redux";
import LText from "../LText";
import Row from "./Row";
import colors from "../../colors";
import { calculateCountervalueSelector } from "../../actions/general";
import { counterValueCurrencySelector } from "../../reducers/settings";

const mapStateToProps = (state, props) => {
  const { accounts } = props;
  const total = accounts.reduce(
    (total, a) => total.plus(a.balance),
    BigNumber(0),
  );

  return {
    accountDistribution: accounts.map(a => ({
      account: a,
      currency: getAccountCurrency(a),
      distribution: a.balance.div(total).toFixed(2),
      amount: a.balance,
      countervalue: calculateCountervalueSelector(state)(
        getAccountCurrency(a),
        a.balance,
      ),
    })),
    counterValueCurrency: counterValueCurrencySelector,
  };
};

const AccountDistribution = ({
  accountDistribution,
}: {
  accountDistribution: *,
  counterValueCurrency: Currency,
}) => (
  <View>
    <LText bold secondary style={styles.distributionTitle}>
      <Trans
        i18nKey="distribution.listAccount"
        count={accountDistribution.length}
        values={{ count: accountDistribution.length }}
      />
    </LText>
    {accountDistribution.map(item => (
      <View style={styles.root} key={item.account.id}>
        <Row item={item} />
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: 16,
  },
  distributionTitle: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.darkBlue,
    marginLeft: 16,
    marginTop: 8,
    marginBottom: 8,
  },
});

export default connect(mapStateToProps)(AccountDistribution);
