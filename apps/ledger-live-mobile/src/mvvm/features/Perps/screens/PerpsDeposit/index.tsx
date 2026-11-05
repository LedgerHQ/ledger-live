import React from "react";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import {
  AmountInput,
  BottomSheetHeader,
  BottomSheetView,
  Box,
  Button,
  Link,
  Skeleton,
  Text,
} from "@ledgerhq/lumen-ui-rnative";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import { useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";
import { getProviderName } from "@ledgerhq/live-common/exchange/swap/utils/index";
import type { TFunction } from "i18next";
import { useTranslation } from "~/context/Locale";
import { PERPS_DEPOSIT_PROVIDER_ID } from "../../constants/depositFunding";
import { AmountKeypad } from "LLM/components/AmountKeypad";
import { RatioPicker } from "LLM/components/RatioPicker";
import { PerpsAccountSelector } from "../../components/PerpsAccountSelector";
import { PerpsDepositSign } from "./components/PerpsDepositSign";
import { PerpsReview } from "./components/PerpsReview";
import type { PerpsDepositViewModel } from "./usePerpsDepositViewModel";

const QUOTED_AMOUNT_SKELETON_SIZE = { width: 112, height: 16 };

/** An account with no price to show falls back to its name alone. */
function describeAccount(
  t: TFunction,
  accountName: string | null,
  counterValue: string | null,
): string {
  if (accountName === null) return t("perpsDeposit.selectCurrencyNoAccount");
  if (counterValue === null) return accountName;
  return t("perpsDeposit.selectCurrencyAccount", { accountName, counterValue });
}

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
  canLearnMore,
  openDetails,
}: Readonly<
  Pick<PerpsDepositViewModel, "statusError" | "depositAmount" | "canLearnMore" | "openDetails">
>) {
  const { t } = useTranslation();
  const provider = getProviderName(PERPS_DEPOSIT_PROVIDER_ID);

  const message = statusError ? (
    <Box lx={{ alignItems: "center", gap: "s4" }}>
      <Text
        typography="body3"
        lx={{ color: "error", textAlign: "center" }}
        testID="perps-deposit-form-error"
      >
        {t(statusError.labelKey, { provider, ...statusError.values })}
      </Text>
      {canLearnMore ? (
        <Link appearance="base" size="sm" onPress={openDetails} testID="perps-deposit-learn-more">
          {t("perpsDeposit.learnMore")}
        </Link>
      ) : null}
    </Box>
  ) : depositAmount > 0 ? (
    <Text typography="body3" lx={{ color: "base", textAlign: "center" }}>
      {t("perpsDeposit.inputSubText", { provider })}
    </Text>
  ) : null;

  return (
    <Box lx={{ minHeight: "s40", justifyContent: "center", alignItems: "center" }}>{message}</Box>
  );
}

function DepositDetailsSheet({
  isDetailsOpen,
  details,
  closeDetails,
  buyFromDetails,
}: Readonly<
  Pick<PerpsDepositViewModel, "isDetailsOpen" | "details" | "closeDetails" | "buyFromDetails">
>) {
  const { t } = useTranslation();
  const { bottom: bottomInset } = useSafeAreaInsets();

  return (
    <QueuedBottomSheet
      isRequestingToBeOpened={isDetailsOpen}
      onClose={closeDetails}
      enableDynamicSizing
      testID="perps-deposit-details"
    >
      <BottomSheetView style={{ paddingBottom: bottomInset + 16 }}>
        {details ? (
          <>
            <BottomSheetHeader
              title={t(details.titleKey, details.values)}
              description={t(details.descriptionKey, details.values)}
            />
            <Button
              appearance="base"
              size="lg"
              lx={{ width: "full", marginTop: "s16" }}
              onPress={buyFromDetails}
              testID="perps-deposit-details-buy"
            >
              {t("perpsDeposit.details.buy", { ticker: details.buyTicker })}
            </Button>
          </>
        ) : null}
      </BottomSheetView>
    </QueuedBottomSheet>
  );
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
  maxBuffer,
  statusError,
  canLearnMore,
  openDetails,
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
          <Box lx={{ minHeight: "s20", justifyContent: "center", alignItems: "center" }}>
            <QuotedAmount
              formattedQuotedAmount={formattedQuotedAmount}
              isQuoteLoading={isQuoteLoading}
            />
          </Box>
          <AmountMessage
            statusError={statusError}
            depositAmount={depositAmount}
            canLearnMore={canLearnMore}
            openDetails={openDetails}
          />
        </Box>

        <PerpsAccountSelector
          title={t("perpsDeposit.selectCurrencyTitle", { currencyTicker: depositCurrencyTicker })}
          ticker={depositCurrencyTicker}
          ledgerId={depositCurrencyLedgerId}
          description={describeAccount(t, depositAccountName, depositAccountCounterValue)}
          hasError={depositAccountName === null ? missingAccount : exceedsBalance}
          onSelect={pickDepositAccount}
          testID="perps-deposit-select-currency"
        />

        <RatioPicker
          maxValue={maxAmount}
          maxBuffer={maxBuffer}
          value={depositAmount}
          decimalPlaces={maxDecimalLength}
          onChange={selectAmountRatio}
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
  const { signingDevice, selectSigningDevice, returnToReview, returnToForm, endSigning } =
    viewModel;
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
      <DepositDetailsSheet
        isDetailsOpen={viewModel.isDetailsOpen}
        details={viewModel.details}
        closeDetails={viewModel.closeDetails}
        buyFromDetails={viewModel.buyFromDetails}
      />

      {isSignOpen && reviewParams ? (
        <PerpsDepositSign
          {...reviewParams}
          selectedDevice={signingDevice}
          onSelectDevice={selectSigningDevice}
          onDone={endSigning}
          onRefused={returnToReview}
          onReturnToForm={returnToForm}
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
