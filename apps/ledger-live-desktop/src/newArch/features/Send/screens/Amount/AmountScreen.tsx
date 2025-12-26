// This is a POC file -> @canestin is on it (so you can remove it)

import React from "react";
import { useTranslation } from "react-i18next";
import { Button, AmountInput } from "@ledgerhq/lumen-ui-react";
import { useAmountViewModel } from "./useAmountViewModel";

export function AmountScreen() {
  const { t } = useTranslation();
  const {
    account,
    transaction,
    status,
    bridgePending,
    currency,
    amount,
    errors,
    canContinue,
    onAmountChange,
    handleContinue,
  } = useAmountViewModel();

  if (!account || !transaction || !status) return null;

  return (
    <div className="flex flex-col justify-between p-6">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label className="text-base body-2-semi-bold">{t("send.steps.details.amount")}</label>
          <AmountInput
            value={amount.isZero() ? "" : amount.toString()}
            onChange={onAmountChange}
            currencyText={currency?.ticker || ""}
            currencyPosition="right"
            allowDecimals
            disabled={bridgePending}
            aria-invalid={!!errors.amount}
          />
          {errors.amount && (
            <p className="text-error body-2">
              {errors.amount.message || t("errors.generic.title")}
            </p>
          )}
        </div>
      </div>

      <Button onClick={handleContinue} disabled={!canContinue} loading={bridgePending}>
        {t("common.continue")}
      </Button>
    </div>
  );
}
