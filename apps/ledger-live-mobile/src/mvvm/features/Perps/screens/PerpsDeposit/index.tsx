import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { AmountInput, Box, Button, Skeleton, Text } from "@ledgerhq/lumen-ui-rnative";
import { useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";
import { getProviderName } from "@ledgerhq/live-common/exchange/swap/utils/index";
import { useTranslation } from "~/context/Locale";
import { PERPS_DEPOSIT_PROVIDER_ID } from "../../constants/depositFunding";
import { AmountKeypad } from "LLM/components/AmountKeypad";
import { RatioPicker } from "LLM/components/RatioPicker";
import { DepositAccountSelector } from "./components/DepositAccountSelector";
import { PerpsDepositSign } from "./components/PerpsDepositSign";
import { PerpsReview } from "./components/PerpsReview";
import type { PerpsDepositViewModel } from "./usePerpsDepositViewModel";

const QUOTED_AMOUNT_SKELETON_SIZE = { width: 112, height: 16 };

function QuotedAmount({
  formattedQuotedAmount,
  isQuoteLoading,
}: Pick<PerpsDepositViewModel, "formattedQuotedAmount" | "isQuoteLoading">) {
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

  if (!formattedQuotedAmount) return null;

  return (
    <Text typography="body3" lx={{ color: "muted" }}>
      {t("perpsDeposit.inputDepositAmount", { value: formattedQuotedAmount })}
    </Text>
  );
}

function AmountMessage({
  statusError,
  depositAmount,
}: Pick<PerpsDepositViewModel, "statusError" | "depositAmount">) {
  const { t } = useTranslation();
  const provider = getProviderName(PERPS_DEPOSIT_PROVIDER_ID);

  if (statusError) {
    return (
      <Text typography="body3" lx={{ color: "error" }} testID="perps-deposit-form-error">
        {t(statusError.labelKey, { provider })}
      </Text>
    );
  }

  if (depositAmount > 0) {
    return (
      <Text typography="body3" lx={{ color: "base" }}>
        {t("perpsDeposit.inputSubText", { provider })}
      </Text>
    );
  }

  return null;
}

function DepositForm({
  headerDescription,
  amountText,
  depositAmount,
  formattedQuotedAmount,
  isQuoteLoading,
  counterValueCode,
  maxDecimalLength,
  pressAmountKey,
  selectAmountRatio,
  depositCurrencyTicker,
  depositCurrencyLedgerId,
  depositAccountName,
  depositAccountCounterValue,
  maxAmount,
  selectMax,
  statusError,
  canReview,
  exceedsBalance,
  missingAccount,
  pickDepositAccount,
  handleReview,
}: Readonly<PerpsDepositViewModel>) {
  const { t } = useTranslation();

  return (
    <>
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
            isInvalid={statusError !== null}
            testID="perps-deposit-amount-input"
          />
          <QuotedAmount
            formattedQuotedAmount={formattedQuotedAmount}
            isQuoteLoading={isQuoteLoading}
          />
          <AmountMessage statusError={statusError} depositAmount={depositAmount} />
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
          onChange={selectAmountRatio}
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
    </>
  );
}

export function PerpsDepositView(viewModel: Readonly<PerpsDepositViewModel>) {
  const { isReviewOpen, reviewParams, closeReview, isSignOpen, handOverToDevice } = viewModel;
  const { signingDevice, selectSigningDevice, returnToReview, endSigning } = viewModel;
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
      <DepositForm {...viewModel} />

      {isSignOpen && reviewParams ? (
        <PerpsDepositSign
          {...reviewParams}
          selectedDevice={signingDevice}
          onSelectDevice={selectSigningDevice}
          onDone={endSigning}
          onRefused={returnToReview}
        />
      ) : null}

      {reviewParams ? (
        <PerpsReview
          {...reviewParams}
          isOpen={isReviewOpen}
          onClose={closeReview}
          onConfirm={handOverToDevice}
        />
      ) : null}
    </SafeAreaView>
  );
}
