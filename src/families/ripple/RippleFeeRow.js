/* @flow */
import React, { useCallback } from "react";
import { View, StyleSheet, Linking } from "react-native";
import { Trans } from "react-i18next";
import { useNavigation, useTheme } from "@react-navigation/native";
import type { AccountLike } from "@ledgerhq/live-common/lib/types";
import type { Transaction } from "@ledgerhq/live-common/lib/families/ripple/types";
import SummaryRow from "../../screens/SendFunds/SummaryRow";
import LText from "../../components/LText";
import CurrencyUnitValue from "../../components/CurrencyUnitValue";
import CounterValue from "../../components/CounterValue";
import ExternalLink from "../../icons/ExternalLink";
import { urls } from "../../config/urls";
import { ScreenName } from "../../const";

type Props = {
  account: AccountLike,
  transaction: Transaction,
};

export default function RippleFeeRow({ account, transaction }: Props) {
  const { colors } = useTheme();
  const navigation = useNavigation();

  const openFees = useCallback(() => {
    navigation.navigate(ScreenName.RippleEditFee, {
      accountId: account.id,
      transaction,
    });
  }, [navigation, account, transaction]);

  const extraInfoFees = useCallback(() => {
    Linking.openURL(urls.feesMoreInfo);
  }, []);

  if (account.type !== "Account") return null;
  const fee = transaction.fee;
  const feeCustomUnit = transaction.feeCustomUnit;

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
          {fee ? (
            <LText style={styles.valueText}>
              <CurrencyUnitValue
                unit={feeCustomUnit || account.unit}
                value={fee}
              />
            </LText>
          ) : null}

          <LText
            style={[
              styles.link,
              {
                textDecorationColor: colors.live,
              },
            ]}
            color="live"
            onPress={openFees}
          >
            <Trans i18nKey="common.edit" />
          </LText>
        </View>
        <LText style={styles.countervalue} color="grey">
          <CounterValue before="≈ " value={fee} currency={account.currency} />
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
  },
  countervalue: {
    fontSize: 12,
  },
  valueText: {
    fontSize: 16,
  },
  link: {
    textDecorationStyle: "solid",
    textDecorationLine: "underline",
    marginLeft: 8,
  },
});
