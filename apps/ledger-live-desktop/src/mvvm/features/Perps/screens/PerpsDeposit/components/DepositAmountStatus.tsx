import React from "react";
import { useTranslation } from "react-i18next";
import type { DepositFormError } from "../utils/validateDepositFlow";

type DepositAmountStatusProps = Readonly<{
  formattedAmount: string;
  currencyTicker: string;
  hasAmount: boolean;
  error: DepositFormError | null;
}>;

export function DepositAmountStatus({
  formattedAmount,
  currencyTicker,
  hasAmount,
  error,
}: DepositAmountStatusProps) {
  const { t } = useTranslation();

  return (
    <div className="mb-40 flex flex-col items-center gap-8 text-center">
      <div className="body-3 text-muted">
        {t("perpsDeposit.inputDepositAmount", {
          value: formattedAmount,
          currencyTicker,
        })}
      </div>
      {error?.isVisible ? (
        <div className="body-3 text-error" data-testid="perps-deposit-form-error">
          {t(error.labelKey)}
        </div>
      ) : hasAmount ? (
        <div className="body-3 text-muted">{t("perpsDeposit.inputSubText")}</div>
      ) : null}
    </div>
  );
}
