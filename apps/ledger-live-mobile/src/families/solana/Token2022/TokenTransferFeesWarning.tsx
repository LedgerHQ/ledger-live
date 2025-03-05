import invariant from "invariant";
import React from "react";
import { StyleSheet, View } from "react-native";
import { Trans } from "react-i18next";
import BigNumber from "bignumber.js";
import { Text } from "@ledgerhq/native-ui";
import { TokenAccount } from "@ledgerhq/types-live";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { Transaction } from "@ledgerhq/live-common/generated/types";
import CounterValue from "~/components/CounterValue";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import SummaryRow from "~/screens/SendFunds/SummaryRow";
import TooltipLabel from "~/components/TooltipLabel";

export default function TokenTransferFeesWarning({
  tokenAccount,
  transaction,
}: {
  tokenAccount: TokenAccount;
  transaction: Transaction;
}) {
  invariant(transaction.family === "solana", "expect solana transaction");
  const transferFees =
    transaction.model.commandDescriptor?.command.kind === "token.transfer"
      ? transaction.model.commandDescriptor.command.extensions?.transferFee
      : undefined;

  if (!transferFees) return null;

  const { transferFee, maxTransferFee, feePercent, feeBps } = transferFees;
  const tokenUnit = tokenAccount.token.units[0];

  return (
    <View>
      <SummaryRow
        title={<Trans i18nKey="send.fees.title" />}
        additionalInfo={
          <TooltipLabel
            label={<></>}
            tooltip={
              <Text fontSize={styles.smallText.fontSize}>
                <Trans
                  i18nKey="solana.token.transferFees.feesPercentHint"
                  values={{
                    feePercent,
                    feeBps,
                    maxFee: formatCurrencyUnit(tokenUnit, new BigNumber(maxTransferFee), {
                      disableRounding: true,
                      alwaysShowSign: false,
                      showCode: true,
                    }),
                  }}
                />
              </Text>
            }
          />
        }
      >
        <View style={{ alignItems: "flex-end" }}>
          <View style={styles.accountContainer}>
            <Text style={styles.valueText}>
              <CurrencyUnitValue unit={tokenUnit} value={transferFee} />
            </Text>
          </View>
          <Text style={styles.smallText} color="grey">
            <CounterValue
              before="≈ "
              value={transferFee}
              currency={tokenAccount.token.parentCurrency}
            />
          </Text>
        </View>
      </SummaryRow>
    </View>
  );
}

const styles = StyleSheet.create({
  accountContainer: {
    flex: 1,
    flexDirection: "row",
  },
  smallText: {
    fontSize: 12,
  },
  valueText: {
    fontSize: 16,
  },
  availableRight: {
    alignItems: "center",
    justifyContent: "flex-end",
    flexDirection: "row",
  },
});
