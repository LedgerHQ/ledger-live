import React from "react";
import { useTranslation } from "react-i18next";
import {
  AmountInput,
  Button,
  DialogBody,
  DialogFooter,
  DialogHeader,
} from "@ledgerhq/lumen-ui-react";
import { DepositAccountSelector } from "./components/DepositAccountSelector";
import { DepositAmountStatus } from "./components/DepositAmountStatus";
import { RatioPicker } from "./components/RatioPicker";
import type { PerpsDepositViewModel } from "./usePerpsDepositViewModel";

export function PerpsDepositView({
  headerDescription,
  amountText,
  depositAmount,
  formattedQuotedAmount,
  isQuoteLoading,
  counterValueCode,
  maxDecimalLength,
  changeDepositAmount,
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
      <DialogHeader
        density="compact"
        title={t("perpsDeposit.title")}
        description={headerDescription}
      />
      <DialogBody>
        <AmountInput
          value={amountText}
          onChange={event => changeDepositAmount(event.target.value)}
          currencyText={counterValueCode}
          aria-invalid={statusError !== null}
          maxDecimalLength={maxDecimalLength}
          data-testid="perps-deposit-amount-input"
        />

        <DepositAmountStatus
          formattedAmount={formattedQuotedAmount}
          isQuoteLoading={isQuoteLoading}
          hasAmount={depositAmount > 0}
          error={statusError}
        />

        <RatioPicker
          maxValue={maxAmount}
          value={depositAmount}
          decimalPlaces={maxDecimalLength}
          onChange={selectAmountRatio}
          onMax={selectMax}
          className="justify-around"
        />

        <DepositAccountSelector
          ticker={depositCurrencyTicker}
          ledgerId={depositCurrencyLedgerId}
          accountName={depositAccountName}
          counterValue={depositAccountCounterValue}
          exceedsBalance={exceedsBalance}
          missingAccount={missingAccount}
          onSelect={pickDepositAccount}
        />
      </DialogBody>

      <DialogFooter>
        <Button
          className="w-full"
          disabled={!canReview}
          onClick={handleReview}
          data-testid="perps-deposit-review-cta"
        >
          {t("perpsDeposit.review")}
        </Button>
      </DialogFooter>
    </>
  );
}
