import { useTheme } from "styled-components/native";
import BigNumber from "bignumber.js";
import React, { type ComponentProps, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { Account } from "@ledgerhq/types-live";
import { TrackScreen } from "~/analytics";
import Alert from "~/components/Alert";
import Button from "~/components/Button";
import ConfirmationModal from "~/components/ConfirmationModal";
import LText from "~/components/LText";
import NavigationScrollView from "~/components/NavigationScrollView";
import SectionSeparator from "~/components/SectionSeparator";
import TranslatedError from "~/components/TranslatedError";
import { Trans } from "~/context/Locale";
import AlertTriangle from "~/icons/AlertTriangle";
import SummaryAmountSection from "~/screens/SendFunds/SummaryAmountSection";
import SummaryFromSection from "~/screens/SendFunds/SummaryFromSection";
import SummaryToSection from "~/screens/SendFunds/SummaryToSection";
import SummaryTotalSection from "~/screens/SendFunds/SummaryTotalSection";

type SummaryAccount = Account;
type SummaryTransaction = ComponentProps<typeof SummaryToSection>["transaction"];
type SummaryAmount = ComponentProps<typeof SummaryAmountSection>["amount"];

type Props = {
  mainAccount: SummaryAccount;
  transaction: SummaryTransaction;
  amount: SummaryAmount;
  totalSpent: SummaryAmount;
  firstError: Error | undefined;
  currencyName?: string;
  subAccountCurrencyName?: string;
  showSubAccountsWarning: boolean;
  overrideAmountLabel?: string;
  feeRows: ReactNode;
  additionalRows?: ReactNode;
  footerAction?: ReactNode;
  isContinueDisabled: boolean;
  isContinuePending: boolean;
  onContinue: () => void;
  highFeesOpen: boolean;
  onRejectFees: () => void;
  onAcceptFees: () => void;
  recipientWarning?: Error;
};

export default function EditTransactionSummaryView({
  mainAccount,
  transaction,
  amount,
  totalSpent,
  firstError,
  currencyName,
  subAccountCurrencyName,
  showSubAccountsWarning,
  overrideAmountLabel,
  feeRows,
  additionalRows,
  footerAction,
  isContinueDisabled,
  isContinuePending,
  onContinue,
  highFeesOpen,
  onRejectFees,
  onAcceptFees,
  recipientWarning,
}: Readonly<Props>) {
  const { colors } = useTheme();
  const shouldDisplayTotal =
    BigNumber.isBigNumber(amount) && BigNumber.isBigNumber(totalSpent)
      ? !amount.eq(totalSpent)
      : amount !== totalSpent;
  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background.main }]}>
      <TrackScreen category="SendFunds" name="Summary" currencyName={currencyName} />
      <NavigationScrollView style={styles.body}>
        {showSubAccountsWarning ? (
          <View style={styles.infoBox}>
            <Alert type="primary">
              <Trans
                i18nKey="send.summary.subaccountsWarning"
                values={{
                  currency: subAccountCurrencyName,
                }}
              />
            </Alert>
          </View>
        ) : null}
        <SummaryFromSection account={mainAccount} parentAccount={undefined} />
        <View style={[styles.verticalConnector, { borderColor: colors.opacityDefault.c10 }]} />
        <SummaryToSection transaction={transaction} currency={mainAccount.currency} />
        {recipientWarning ? (
          <LText style={styles.warning} color="orange">
            <TranslatedError error={recipientWarning} />
          </LText>
        ) : null}
        <SectionSeparator lineColor={colors.opacityDefault.c10} />

        <SummaryAmountSection
          account={mainAccount}
          parentAccount={undefined}
          amount={amount}
          overrideAmountLabel={overrideAmountLabel}
        />

        {feeRows}
        {additionalRows}

        {shouldDisplayTotal ? (
          <>
            <SectionSeparator lineColor={colors.opacityDefault.c10} />
            <SummaryTotalSection
              account={mainAccount}
              parentAccount={undefined}
              amount={totalSpent}
            />
          </>
        ) : null}
      </NavigationScrollView>
      <View style={styles.footer}>
        <LText style={styles.error} color="alert">
          <TranslatedError error={firstError} />
        </LText>
        {footerAction ?? (
          <Button
            event="SummaryContinue"
            type="primary"
            title={<Trans i18nKey="common.continue" />}
            containerStyle={styles.continueButton}
            onPress={onContinue}
            disabled={isContinueDisabled}
            pending={isContinuePending}
          />
        )}
      </View>
      <ConfirmationModal
        isOpened={highFeesOpen}
        onClose={onRejectFees}
        onConfirm={onAcceptFees}
        Icon={AlertTriangle}
        confirmationDesc={
          <Trans i18nKey="send.highFeeModal">
            {"Be careful, your fees represent more than "}
            <LText color="smoke" bold>
              10%
            </LText>
            {" of the amount. Do you want to continue?"}
          </Trans>
        }
        confirmButtonText={<Trans i18nKey="common.continue" />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: "column",
  },
  infoBox: {
    marginTop: 16,
  },
  body: {
    flex: 1,
    paddingHorizontal: 16,
    backgroundColor: "transparent",
  },
  footer: {
    flexDirection: "column",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
  },
  continueButton: {
    alignSelf: "stretch",
  },
  error: {
    fontSize: 12,
    marginBottom: 5,
  },
  warning: {
    fontSize: 14,
    marginBottom: 16,
    paddingLeft: 50,
  },
  verticalConnector: {
    position: "absolute",
    borderLeftWidth: 2,
    height: 20,
    top: 60,
    left: 16,
  },
});
