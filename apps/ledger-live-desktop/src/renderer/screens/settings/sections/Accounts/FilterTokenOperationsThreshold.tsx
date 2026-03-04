import React, { useCallback, useMemo, useState } from "react";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { useTranslation } from "react-i18next";
import { useSelector } from "LLD/hooks/redux";
import {
  useFilterTokenOperationsThreshold,
  useFilterTokenOperationsZeroAmount,
} from "~/renderer/actions/settings";
import Box from "~/renderer/components/Box";
import Input from "~/renderer/components/Input";
import { counterValueCurrencySelector } from "~/renderer/reducers/settings";

const sanitizeThresholdInput = (value: string) =>
  value.replaceAll(",", ".").replaceAll(/[^0-9.]/g, "");

const MAX_THRESHOLD = 0.5;

export default function FilterTokenOperationsThreshold() {
  const { t } = useTranslation();
  const [isFilterEnabled] = useFilterTokenOperationsZeroAmount();
  const [threshold, setThreshold] = useFilterTokenOperationsThreshold();
  const isSmallValueFeatureEnabled =
    useFeature("lldHideSmallValueTokenOperations")?.enabled ?? false;
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const [draftValue, setDraftValue] = useState<string | null>(null);
  const inputValue = draftValue ?? String(threshold);

  const helperAmountLabel = useMemo(
    () => `${counterValueCurrency.units[0].code}${MAX_THRESHOLD}`,
    [counterValueCurrency],
  );

  const isThresholdInvalid = useMemo(() => {
    if (!inputValue || inputValue === ".") {
      return false;
    }

    const parsedValue = Number.parseFloat(inputValue);
    return Number.isFinite(parsedValue) && parsedValue > MAX_THRESHOLD;
  }, [inputValue]);

  const onChange = useCallback((rawValue: string) => {
    const sanitized = sanitizeThresholdInput(rawValue);
    setDraftValue(sanitized);
  }, []);

  const onBlur = useCallback(() => {
    if (!inputValue || inputValue === "." || isThresholdInvalid) {
      setDraftValue(null);
      return;
    }

    const parsedValue = Number.parseFloat(inputValue);
    if (Number.isFinite(parsedValue)) {
      setThreshold(parsedValue);
      setDraftValue(null);
    }
  }, [inputValue, isThresholdInvalid, setThreshold]);

  if (!isSmallValueFeatureEnabled || !isFilterEnabled) {
    return null;
  }

  return (
    <Box
      data-testid="filter-token-operations-threshold-container"
      mr={2}
      relative
      style={{ width: 130 }}
    >
      <Input
        value={inputValue}
        onChange={onChange}
        onBlur={onBlur}
        inputMode="decimal"
        small
        error={isThresholdInvalid}
        hideErrorMessage
        renderRight={
          <Box pr={2} ff="Inter|SemiBold" color="neutral.c70" fontSize={2}>
            {counterValueCurrency.ticker}
          </Box>
        }
        data-testid="input-filter-token-operations-threshold"
      />
      <Box
        mt={0}
        ff="Inter|Medium"
        fontSize={1}
        textAlign="right"
        color={isThresholdInvalid ? "alertRed" : "neutral.c70"}
        data-testid="filter-token-operations-threshold-helper"
        style={{
          userSelect: "none",
          lineHeight: "12px",
          position: "absolute",
          right: 0,
          top: 38,
          whiteSpace: "nowrap",
        }}
      >
        {t("settings.accounts.filterTokenOperationsThreshold.desc", {
          amount: helperAmountLabel,
        })}
      </Box>
    </Box>
  );
}
