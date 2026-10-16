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
import { PERPS_SWAPKIT_PROVIDER } from "@ledgerhq/live-common/wallet-api/Perps/constants";
import { PerpsAccountSelector } from "LLD/features/Perps/components/PerpsAccountSelector";
import { PerpsAmountStatus } from "LLD/features/Perps/components/PerpsAmountStatus";
import { RatioPicker } from "LLD/features/Perps/components/RatioPicker";
import type { PerpsWithdrawViewModel } from "./usePerpsWithdrawViewModel";

const TEST_ID_PREFIX = "perps-withdraw";

export function PerpsWithdrawView({
  headerDescription,
  amountText,
  amount,
  quotedAmount,
  isQuoteLoading,
  maxDecimalLength,
  changeAmount,
  selectAmountRatio,
  maxAmount,
  selectMax,
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
}: PerpsWithdrawViewModel) {
  const { t } = useTranslation();
  const provider = getProviderName(PERPS_SWAPKIT_PROVIDER);

  return (
    <>
      <DialogHeader
        density="compact"
        title={t("perpsWithdraw.title")}
        description={headerDescription}
      />
      <DialogBody>
        <AmountInput
          value={amountText}
          onChange={event => changeAmount(event.target.value)}
          currencyText="USD"
          aria-invalid={statusError !== null}
          maxDecimalLength={maxDecimalLength}
          data-testid={`${TEST_ID_PREFIX}-amount-input`}
        />

        <PerpsAmountStatus
          quotedAmountText={
            quotedAmount ? t("perpsWithdraw.estimatedAmount", { value: quotedAmount }) : null
          }
          isQuoteLoading={isQuoteLoading}
          notice={amount > 0 ? t("perpsWithdraw.inputSubText", { provider }) : null}
          errorMessage={
            statusError ? t(statusError.labelKey, { provider, ...statusError.values }) : null
          }
          testIdPrefix={TEST_ID_PREFIX}
        />

        <RatioPicker
          maxValue={maxAmount}
          value={amount}
          decimalPlaces={maxDecimalLength}
          onChange={selectAmountRatio}
          onMax={selectMax}
          testIdPrefix={TEST_ID_PREFIX}
          className="justify-around"
        />

        <PerpsAccountSelector
          title={t("perpsWithdraw.selectCurrencyTitle", { currencyTicker: destinationTicker })}
          ticker={destinationTicker}
          ledgerId={destinationLedgerId}
          accountName={destinationAccountName}
          counterValue={destinationCounterValue}
          accountLabelKey="perpsWithdraw.selectCurrencyAccount"
          noAccountLabel={t("perpsWithdraw.selectCurrencyNoAccount")}
          exceedsBalance={exceedsBalance}
          missingAccount={missingAccount}
          onSelect={pickDestinationAccount}
          testId={`${TEST_ID_PREFIX}-select-currency`}
        />
      </DialogBody>

      <DialogFooter>
        <Button
          className="w-full"
          disabled={!canReview}
          onClick={handleReview}
          data-testid={`${TEST_ID_PREFIX}-review-cta`}
        >
          {t("perpsWithdraw.review")}
        </Button>
      </DialogFooter>
    </>
  );
}
