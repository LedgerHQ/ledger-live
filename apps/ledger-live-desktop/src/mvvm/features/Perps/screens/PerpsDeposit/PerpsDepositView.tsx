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
  depositAmount,
  formattedDepositAmount,
  depositAmountTicker,
  isQuoteLoading,
  counterValueCode,
  maxDecimalLength,
  changeDepositAmount,
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

  return (
    <>
      <DialogHeader
        density="compact"
        title={t("perpsDeposit.title")}
        description={headerDescription}
      />
      <DialogBody>
        <AmountInput
          value={depositAmount}
          onChange={event => changeDepositAmount(event.target.value)}
          currencyText={counterValueCode}
          maxIntegerLength={8}
          aria-invalid={submitError?.isVisible ?? false}
          data-testid="perps-deposit-amount-input"
        />

        <DepositAmountStatus
          formattedAmount={formattedDepositAmount}
          currencyTicker={depositAmountTicker}
          isQuoteLoading={isQuoteLoading}
          error={submitError}
        />

        <RatioPicker
          maxValue={maxAmount}
          value={depositAmount}
          decimalPlaces={maxDecimalLength}
          onChange={setDepositAmount}
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
