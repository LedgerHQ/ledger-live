import React from "react";
import { useTranslation } from "react-i18next";
import { Skeleton } from "@ledgerhq/lumen-ui-react";
import { getProviderName } from "@ledgerhq/live-common/exchange/swap/utils/index";
import { PERPS_DEPOSIT_PROVIDER_ID } from "LLD/features/Perps/constants/depositFunding";
import type { DepositFormError } from "../utils/validateDepositFlow";

type DepositAmountStatusProps = Readonly<{
  formattedAmount: string;
  isQuoteLoading: boolean;
  hasAmount: boolean;
  error: DepositFormError | null;
}>;

function QuotedAmount({
  formattedAmount,
  isQuoteLoading,
}: Pick<DepositAmountStatusProps, "formattedAmount" | "isQuoteLoading">) {
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
      })}
    </div>
  );
}

export function DepositAmountStatus({
  formattedAmount,
  isQuoteLoading,
  hasAmount,
  error,
}: DepositAmountStatusProps) {
  const { t } = useTranslation();
  const provider = getProviderName(PERPS_DEPOSIT_PROVIDER_ID);

  const errorMessage = error ? (
    <p className="body-3 text-error" data-testid="perps-deposit-form-error">
      {t(error.labelKey, { provider })}
    </p>
  ) : null;

  const providerNotice = hasAmount ? (
    <p className="body-2 text-base">{t("perpsDeposit.inputSubText", { provider })}</p>
  ) : null;

  return (
    <div className="mb-40 flex flex-col items-center gap-8 text-center">
      <QuotedAmount formattedAmount={formattedAmount} isQuoteLoading={isQuoteLoading} />
      {errorMessage ?? providerNotice}
    </div>
  );
}
