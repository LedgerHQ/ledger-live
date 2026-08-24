import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { AmountInput, Box, Button, Skeleton, Text } from "@ledgerhq/lumen-ui-rnative";
import { useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";
import { useTranslation } from "~/context/Locale";
import { AmountKeypad } from "LLM/components/AmountKeypad";
import { RatioPicker } from "LLM/components/RatioPicker";
import { DepositAccountSelector } from "./components/DepositAccountSelector";
import type { PerpsDepositViewModel } from "./usePerpsDepositViewModel";

const QUOTED_AMOUNT_SKELETON_SIZE = { width: 112, height: 16 };

function QuotedAmount({
  formattedDepositAmount,
  depositAmountTicker,
  isQuoteLoading,
}: Pick<
  PerpsDepositViewModel,
  "formattedDepositAmount" | "depositAmountTicker" | "isQuoteLoading"
>) {
  const { t } = useTranslation();

  if (isQuoteLoading) {
    return (
      <Skeleton
        testID="perps-deposit-quote-skeleton"
        lx={{ borderRadius: "sm" }}
        style={QUOTED_AMOUNT_SKELETON_SIZE}
      />
    );
  }

  if (!formattedDepositAmount) return null;

  return (
    <Text typography="body3" lx={{ color: "muted" }}>
      {t("perpsDeposit.inputDepositAmount", {
        value: formattedDepositAmount,
        currencyTicker: depositAmountTicker,
      })}
    </Text>
  );
}

function AmountMessage({
  submitError,
  depositAmount,
}: Pick<PerpsDepositViewModel, "submitError" | "depositAmount">) {
  const { t } = useTranslation();

  if (submitError) {
    return (
      <Text typography="body3" lx={{ color: "error" }} testID="perps-deposit-form-error">
        {t(submitError.labelKey)}
      </Text>
    );
  }

  if (depositAmount > 0) {
    return (
      <Text typography="body3" lx={{ color: "base" }}>
        {t("perpsDeposit.inputSubText")}
      </Text>
    );
  }

  return null;
}

export function PerpsDepositView({
  headerDescription,
  amountText,
  depositAmount,
  formattedDepositAmount,
  depositAmountTicker,
  isQuoteLoading,
  counterValueCode,
  maxDecimalLength,
  pressAmountKey,
  setDepositAmount,
  depositCurrencyTicker,
  depositCurrencyLedgerId,
  depositAccountName,
  depositAccountCounterValue,
  maxAmount,
  selectMax,
  submitError,
  canReview,
  exceedsBalance,
  missingAccount,
  pickDepositAccount,
  handleReview,
}: Readonly<PerpsDepositViewModel>) {
  const { t } = useTranslation();
  const styles = useStyleSheet(
    theme => ({
      root: {
        flex: 1,
        backgroundColor: theme.colors.bg.base,
      },
    }),
    [],
  );

  return (
    <SafeAreaView edges={["bottom"]} style={styles.root}>
      <Box lx={{ flex: 1, paddingHorizontal: "s16", gap: "s16" }}>
        <Text typography="body2" lx={{ color: "muted", textAlign: "center" }}>
          {headerDescription}
        </Text>

        <Box lx={{ flex: 1, justifyContent: "center", alignItems: "center", gap: "s8" }}>
          <AmountInput
            value={amountText}
            currencyText={counterValueCode}
            autoFocus
            showSoftInputOnFocus={false}
            // The in-app keypad is the only input path, so the field is display-only.
            onChangeText={() => undefined}
            isInvalid={submitError !== null}
            testID="perps-deposit-amount-input"
          />
          <QuotedAmount
            formattedDepositAmount={formattedDepositAmount}
            depositAmountTicker={depositAmountTicker}
            isQuoteLoading={isQuoteLoading}
          />
          <AmountMessage submitError={submitError} depositAmount={depositAmount} />
        </Box>

        <DepositAccountSelector
          ticker={depositCurrencyTicker}
          ledgerId={depositCurrencyLedgerId}
          accountName={depositAccountName}
          counterValue={depositAccountCounterValue}
          exceedsBalance={exceedsBalance}
          missingAccount={missingAccount}
          onSelect={pickDepositAccount}
        />

        <RatioPicker
          maxValue={maxAmount}
          value={depositAmount}
          decimalPlaces={maxDecimalLength}
          onChange={setDepositAmount}
          onMax={selectMax}
          testIDPrefix="perps-deposit-ratio"
        />

        <AmountKeypad
          onKeyPress={pressAmountKey}
          testIDPrefix="perps-deposit-key"
          deleteAccessibilityLabel={t("perpsDeposit.keypadDelete")}
        />
      </Box>

      <Box lx={{ paddingHorizontal: "s16", paddingTop: "s16" }}>
        <Button
          appearance="base"
          size="lg"
          lx={{ width: "full" }}
          disabled={!canReview}
          onPress={handleReview}
          testID="perps-deposit-review-cta"
        >
          {t("perpsDeposit.review")}
        </Button>
      </Box>
    </SafeAreaView>
  );
}
