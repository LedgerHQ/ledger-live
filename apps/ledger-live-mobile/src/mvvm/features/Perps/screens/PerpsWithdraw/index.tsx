import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { AmountInput, Box, Button, Skeleton, Text } from "@ledgerhq/lumen-ui-rnative";
import { useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";
import { getProviderName } from "@ledgerhq/live-common/exchange/swap/utils/index";
import { PERPS_SWAPKIT_PROVIDER } from "@ledgerhq/live-common/wallet-api/Perps/constants";
import { useTranslation } from "~/context/Locale";
import { AmountKeypad } from "LLM/components/AmountKeypad";
import { RatioPicker } from "LLM/components/RatioPicker";
import { PerpsAccountSelector } from "../../components/PerpsAccountSelector";
import type { PerpsWithdrawViewModel } from "./usePerpsWithdrawViewModel";

const TEST_ID_PREFIX = "perps-withdraw";
const QUOTED_AMOUNT_SKELETON_SIZE = { width: 112, height: 16 };

function QuotedAmount({
  quotedAmount,
  isQuoteLoading,
}: Pick<PerpsWithdrawViewModel, "quotedAmount" | "isQuoteLoading">) {
  const { t } = useTranslation();

  if (isQuoteLoading) {
    return (
      <Skeleton
        testID={`${TEST_ID_PREFIX}-quote-skeleton`}
        lx={{ borderRadius: "sm" }}
        style={QUOTED_AMOUNT_SKELETON_SIZE}
      />
    );
  }

  if (!quotedAmount) return null;

  return (
    <Text typography="body3" lx={{ color: "muted" }}>
      {t("perpsWithdraw.estimatedAmount", { value: quotedAmount })}
    </Text>
  );
}

function AmountMessage({
  statusError,
  amount,
}: Pick<PerpsWithdrawViewModel, "statusError" | "amount">) {
  const { t } = useTranslation();
  const provider = getProviderName(PERPS_SWAPKIT_PROVIDER);

  const message = statusError ? (
    <Text
      typography="body3"
      lx={{ color: "error", textAlign: "center" }}
      testID={`${TEST_ID_PREFIX}-form-error`}
    >
      {t(statusError.labelKey, { provider, ...statusError.values })}
    </Text>
  ) : amount > 0 ? (
    <Text typography="body3" lx={{ color: "base", textAlign: "center" }}>
      {t("perpsWithdraw.inputSubText", { provider })}
    </Text>
  ) : null;

  return (
    <Box lx={{ minHeight: "s40", justifyContent: "center", alignItems: "center" }}>{message}</Box>
  );
}

function describeDestination(
  t: ReturnType<typeof useTranslation>["t"],
  accountName: string | null,
  counterValue: string | null,
): string {
  if (accountName === null) return t("perpsWithdraw.selectCurrencyNoAccount");
  if (counterValue === null) return accountName;
  return t("perpsWithdraw.selectCurrencyAccount", { accountName, counterValue });
}

export function PerpsWithdrawView({
  headerDescription,
  amountText,
  amount,
  currencyCode,
  quotedAmount,
  isQuoteLoading,
  maxDecimalLength,
  pressAmountKey,
  selectAmountRatio,
  maxAmount,
  destinationTicker,
  destinationLedgerId,
  destinationAccountName,
  destinationCounterValue,
  missingAccount,
  pickDestinationAccount,
  statusError,
  exceedsBalance,
  canReview,
  handleReview,
}: Readonly<PerpsWithdrawViewModel>) {
  const { t } = useTranslation();
  const styles = useStyleSheet(
    theme => ({ root: { flex: 1, backgroundColor: theme.colors.bg.base } }),
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
            currencyText={currencyCode}
            autoFocus
            showSoftInputOnFocus={false}
            // The in-app keypad is the only input path, so the field is display-only.
            onChangeText={() => undefined}
            isInvalid={statusError !== null}
            testID={`${TEST_ID_PREFIX}-amount-input`}
          />
          <Box lx={{ minHeight: "s20", justifyContent: "center", alignItems: "center" }}>
            <QuotedAmount quotedAmount={quotedAmount} isQuoteLoading={isQuoteLoading} />
          </Box>
          <AmountMessage statusError={statusError} amount={amount} />
        </Box>

        <PerpsAccountSelector
          title={t("perpsWithdraw.selectCurrencyTitle", { currencyTicker: destinationTicker })}
          ticker={destinationTicker}
          ledgerId={destinationLedgerId}
          description={describeDestination(t, destinationAccountName, destinationCounterValue)}
          hasError={destinationAccountName === null ? missingAccount : exceedsBalance}
          onSelect={pickDestinationAccount}
          testID={`${TEST_ID_PREFIX}-select-currency`}
        />

        <RatioPicker
          maxValue={maxAmount}
          value={amount}
          decimalPlaces={maxDecimalLength}
          onChange={selectAmountRatio}
          testIDPrefix={`${TEST_ID_PREFIX}-ratio`}
        />

        <AmountKeypad
          onKeyPress={pressAmountKey}
          testIDPrefix={`${TEST_ID_PREFIX}-key`}
          deleteAccessibilityLabel={t("perpsWithdraw.keypadDelete")}
        />
      </Box>

      <Box lx={{ paddingHorizontal: "s16", paddingTop: "s16" }}>
        <Button
          appearance="base"
          size="lg"
          lx={{ width: "full" }}
          disabled={!canReview}
          onPress={handleReview}
          testID={`${TEST_ID_PREFIX}-review-cta`}
        >
          {t("perpsWithdraw.review")}
        </Button>
      </Box>
    </SafeAreaView>
  );
}
