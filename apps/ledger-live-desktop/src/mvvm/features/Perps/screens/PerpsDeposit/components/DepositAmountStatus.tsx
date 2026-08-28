import React from "react";
import { useTranslation } from "react-i18next";
import { Skeleton } from "@ledgerhq/lumen-ui-react";
import { PERPS_DEPOSIT_PROVIDER_NAME } from "LLD/features/Perps/constants/depositFunding";
import type { DepositFormError } from "../utils/validateDepositFlow";

type DepositAmountStatusProps = Readonly<{
  formattedAmount: string;
  currencyTicker: string;
  isQuoteLoading: boolean;
  hasAmount: boolean;
  error: DepositFormError | null;
}>;

function QuotedAmount({
  formattedAmount,
  currencyTicker,
  isQuoteLoading,
}: Pick<DepositAmountStatusProps, "formattedAmount" | "currencyTicker" | "isQuoteLoading">) {
  const { t } = useTranslation();

  if (isQuoteLoading) {
    return (
      <Skeleton className="h-16 w-144 rounded-sm" data-testid="perps-deposit-quote-skeleton" />
    );
  }

  if (!formattedAmount) return null;

  return (
    <div className="body-3 text-muted">
      {t("perpsDeposit.inputDepositAmount", {
        value: formattedAmount,
        currencyTicker,
      })}
    </div>
  );
}

export function DepositAmountStatus({
  formattedAmount,
  currencyTicker,
  isQuoteLoading,
  hasAmount,
  error,
}: DepositAmountStatusProps) {
  const { t } = useTranslation();

  const errorMessage = error ? (
    <p className="body-3 text-error" data-testid="perps-deposit-form-error">
      {t(error.labelKey, { provider: PERPS_DEPOSIT_PROVIDER_NAME })}
    </p>
  ) : null;

  const providerNotice = hasAmount ? (
    <p className="body-2 text-base">
      {t("perpsDeposit.inputSubText", { provider: PERPS_DEPOSIT_PROVIDER_NAME })}
    </p>
  ) : null;

  return (
    <div className="mb-40 flex flex-col items-center gap-8 text-center">
      <QuotedAmount
        formattedAmount={formattedAmount}
        currencyTicker={currencyTicker}
        isQuoteLoading={isQuoteLoading}
      />
      {errorMessage ?? providerNotice}
    </div>
  );
}
