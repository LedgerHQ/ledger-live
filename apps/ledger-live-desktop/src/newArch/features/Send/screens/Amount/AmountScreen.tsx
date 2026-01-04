// This is a POC file -> @canestin is on it (so you can remove it)

import React, { useState, useEffect } from "react";
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
    displayAmount,
    errors,
    canContinue,
    onAmountChange,
    handleContinue,
  } = useAmountViewModel();

  const [inputValue, setInputValue] = useState(displayAmount);

  // Sync input value with displayAmount when it changes externally
  useEffect(() => {
    setInputValue(displayAmount);
  }, [displayAmount]);

  if (!account || !transaction || !status) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    onAmountChange(e);
  };

  return (
    <div className="flex flex-col justify-between p-6">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label className="text-base body-2-semi-bold">{t("send.steps.details.amount")}</label>
          <AmountInput
            value={inputValue}
            onChange={handleInputChange}
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
