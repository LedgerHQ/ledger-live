import React from "react";
import { View, StyleSheet } from "react-native";
import { Trans } from "react-i18next";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { getAccountUnit, getAccountCurrency } from "@ledgerhq/live-common/account/helpers";
import BigNumber from "bignumber.js";
import SummaryRow from "./SummaryRow";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import CounterValue from "~/components/CounterValue";
import LText from "~/components/LText";

const styles = StyleSheet.create({
  amountContainer: {
    flexDirection: "column",
    alignItems: "flex-end",
  },
  valueText: {
    fontSize: 16,
  },
  counterValueText: {
    fontSize: 12,
  },
});

type Props = {
  account: AccountLike;
  parentAccount: Account | null | undefined;
  amount: number | BigNumber;
  overrideAmountLabel?: string;
};

const SummaryAmountSection = ({ account, amount, overrideAmountLabel }: Props) => {
  const unit = getAccountUnit(account);
  const currency = getAccountCurrency(account);

  return (
    <SummaryRow title={<Trans i18nKey="send.summary.amount" />}>
      <View style={styles.amountContainer}>
        {overrideAmountLabel ? (
          <LText style={styles.valueText} semiBold>
            {overrideAmountLabel}
          </LText>
        ) : (
          <>
            <LText style={styles.valueText} semiBold testID="send-summary-amount">
              <CurrencyUnitValue unit={unit} value={amount} disableRounding />
            </LText>
            <LText style={styles.counterValueText} color="grey" semiBold>
              <CounterValue before="≈ " value={amount} currency={currency} showCode />
            </LText>
          </>
        )}
      </View>
    </SummaryRow>
  );
};

export default SummaryAmountSection;
