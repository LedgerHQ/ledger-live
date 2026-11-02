import React from "react";
import { useTranslation } from "react-i18next";
import {
  AmountInput,
  Button,
  DialogBody,
  DialogFooter,
  DialogHeader,
} from "@ledgerhq/lumen-ui-react";
import { getProviderName } from "@ledgerhq/live-common/exchange/swap/utils/index";
import { PerpsAccountSelector } from "LLD/features/Perps/components/PerpsAccountSelector";
import { PerpsAmountStatus } from "LLD/features/Perps/components/PerpsAmountStatus";
import { RatioPicker } from "LLD/features/Perps/components/RatioPicker";
import { PERPS_DEPOSIT_PROVIDER_ID } from "LLD/features/Perps/constants/depositFunding";
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
  maxBuffer,
  selectMax,
  statusError,
  canReview,
  exceedsBalance,
  missingAccount,
  pickDepositAccount,
  handleReview,
}: Readonly<PerpsDepositViewModel>) {
  const { t } = useTranslation();
  const provider = getProviderName(PERPS_DEPOSIT_PROVIDER_ID);

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

        <PerpsAmountStatus
          quotedAmountText={
            formattedQuotedAmount
              ? t("perpsDeposit.inputDepositAmount", { value: formattedQuotedAmount })
              : null
          }
          isQuoteLoading={isQuoteLoading}
          notice={depositAmount > 0 ? t("perpsDeposit.inputSubText", { provider }) : null}
          errorMessage={statusError ? t(statusError.labelKey, { provider }) : null}
          testIdPrefix="perps-deposit"
        />

        <RatioPicker
          maxValue={maxAmount}
          maxBuffer={maxBuffer}
          value={depositAmount}
          decimalPlaces={maxDecimalLength}
          onChange={selectAmountRatio}
          onMax={selectMax}
          testIdPrefix="perps-deposit"
          className="justify-around"
        />

        <PerpsAccountSelector
          title={t("perpsDeposit.selectCurrencyTitle", { currencyTicker: depositCurrencyTicker })}
          ticker={depositCurrencyTicker}
          ledgerId={depositCurrencyLedgerId}
          accountName={depositAccountName}
          counterValue={depositAccountCounterValue}
          accountLabelKey="perpsDeposit.selectCurrencyAccount"
          noAccountLabel={t("perpsDeposit.selectCurrencyNoAccount")}
          exceedsBalance={exceedsBalance}
          missingAccount={missingAccount}
          onSelect={pickDepositAccount}
          testId="perps-deposit-select-currency"
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
