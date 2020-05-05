// @flow
import React, { useCallback } from "react";
import { View, StyleSheet, Linking } from "react-native";
import type { AccountLike } from "@ledgerhq/live-common/lib/types";
import { Trans } from "react-i18next";
import type { Transaction } from "@ledgerhq/live-common/lib/families/stellar/types";
import {
  getAccountUnit,
  getAccountCurrency,
} from "@ledgerhq/live-common/lib/account";
import SummaryRow from "../../screens/SendFunds/SummaryRow";
import LText from "../../components/LText";
import CurrencyUnitValue from "../../components/CurrencyUnitValue";
import CounterValue from "../../components/CounterValue";
import ExternalLink from "../../icons/ExternalLink";
import { urls } from "../../config/urls";
import colors from "../../colors";

type Props = {
  account: AccountLike,
  transaction: Transaction,
};

export default function StellarFeeRow({ account, transaction }: Props) {
  const extraInfoFees = useCallback(() => {
    Linking.openURL(urls.feesMoreInfo);
  }, []);

  if (transaction.family !== "stellar") return null;
  const fees = transaction.fees;
  const unit = getAccountUnit(account);
  const currency = getAccountCurrency(account);

  return (
    <SummaryRow
      onPress={extraInfoFees}
      title={<Trans i18nKey="send.fees.title" />}
      additionalInfo={
        <View>
          <ExternalLink size={12} color={colors.grey} />
        </View>
      }
    >
      <View style={{ alignItems: "flex-end" }}>
        <View style={styles.accountContainer}>
          {fees ? (
            <LText style={styles.valueText}>
              <CurrencyUnitValue unit={unit} value={fees} />
            </LText>
          ) : null}
        </View>
        <LText style={styles.countervalue}>
          <CounterValue before="≈ " value={fees} currency={currency} />
        </LText>
      </View>
    </SummaryRow>
  );
}

const styles = StyleSheet.create({
  accountContainer: {
    flex: 1,
    flexDirection: "row",
  },
  summaryRowText: {
    fontSize: 16,
    textAlign: "right",
    color: colors.darkBlue,
  },
  countervalue: {
    fontSize: 12,
    color: colors.grey,
  },
  valueText: {
    fontSize: 16,
  },
  link: {
    color: colors.live,
    textDecorationStyle: "solid",
    textDecorationLine: "underline",
    textDecorationColor: colors.live,
    marginLeft: 8,
  },
});
