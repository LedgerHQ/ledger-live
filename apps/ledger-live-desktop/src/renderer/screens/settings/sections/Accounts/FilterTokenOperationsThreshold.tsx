import React, { useCallback, useEffect, useMemo, useState } from "react";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { useCountervaluesState } from "@ledgerhq/live-countervalues-react";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import {
  convertThresholdFromCountervalueMinorUnitToUsd,
  convertThresholdFromUsdToCountervalueMinorUnit,
  floorThresholdToCurrencyMinorUnit,
  formatThresholdMinorUnitForInput,
  MAX_SMALL_VALUE_OPERATIONS_THRESHOLD_USD,
} from "@ledgerhq/live-common/utils/smallValueOperationsThreshold";
import { useTranslation } from "react-i18next";
import { useSelector } from "LLD/hooks/redux";
import {
  useFilterTokenOperationsThreshold,
  useFilterTokenOperationsZeroAmount,
} from "~/renderer/actions/settings";
import Box from "~/renderer/components/Box";
import Input from "~/renderer/components/Input";
import { counterValueCurrencySelector, localeSelector } from "~/renderer/reducers/settings";

const sanitizeThresholdInput = (value: string) =>
  value.replaceAll(",", ".").replaceAll(/[^0-9.]/g, "");

export default function FilterTokenOperationsThreshold() {
  const { t } = useTranslation();
  const [isFilterEnabled] = useFilterTokenOperationsZeroAmount();
  const [threshold, setThreshold] = useFilterTokenOperationsThreshold();
  const isSmallValueFeatureEnabled =
    useFeature("lldHideSmallValueTokenOperations")?.enabled ?? false;
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const locale = useSelector(localeSelector);
  const countervaluesState = useCountervaluesState();
  const [draftValue, setDraftValue] = useState<string | null>(null);

  const displayedThresholdMinorUnit = useMemo(
    () =>
      convertThresholdFromUsdToCountervalueMinorUnit({
        counterValueCurrency,
        countervaluesState,
        thresholdUsd: threshold,
      }),
    [counterValueCurrency, countervaluesState, threshold],
  );

  const displayedThresholdInputValue = useMemo(
    () =>
      displayedThresholdMinorUnit
        ? formatThresholdMinorUnitForInput(displayedThresholdMinorUnit, counterValueCurrency)
        : "",
    [counterValueCurrency, displayedThresholdMinorUnit],
  );

  const inputValue = draftValue ?? displayedThresholdInputValue;

  const helperAmountValue = useMemo(
    () =>
      displayedThresholdMinorUnit
        ? formatCurrencyUnit(counterValueCurrency.units[0], displayedThresholdMinorUnit, {
            locale,
            disableRounding: true,
            showCode: false,
          })
        : null,
    [counterValueCurrency, displayedThresholdMinorUnit, locale],
  );

  const helperAmountLabel = useMemo(
    () =>
      helperAmountValue ? `${helperAmountValue} ${counterValueCurrency.ticker}` : null,
    [counterValueCurrency.ticker, helperAmountValue],
  );

  const isThresholdInvalid = useMemo(() => {
    if (!inputValue || inputValue === ".") {
      return false;
    }

    const parsedValue = Number.parseFloat(inputValue);
    const thresholdMinorUnit = floorThresholdToCurrencyMinorUnit(parsedValue, counterValueCurrency);

    if (!thresholdMinorUnit) {
      return false;
    }

    const thresholdUsd = convertThresholdFromCountervalueMinorUnitToUsd({
      counterValueCurrency,
      countervaluesState,
      thresholdMinorUnit,
    });

    return thresholdUsd !== null && thresholdUsd > MAX_SMALL_VALUE_OPERATIONS_THRESHOLD_USD;
  }, [counterValueCurrency, countervaluesState, inputValue]);

  useEffect(() => {
    setDraftValue(null);
  }, [counterValueCurrency.ticker]);

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
    const thresholdMinorUnit = floorThresholdToCurrencyMinorUnit(parsedValue, counterValueCurrency);

    if (!thresholdMinorUnit) {
      setDraftValue(null);
      return;
    }

    const thresholdUsd = convertThresholdFromCountervalueMinorUnitToUsd({
      counterValueCurrency,
      countervaluesState,
      thresholdMinorUnit,
    });

    if (thresholdUsd === null) {
      return;
    }

    setThreshold(thresholdUsd);
    setDraftValue(null);
  }, [counterValueCurrency, countervaluesState, inputValue, isThresholdInvalid, setThreshold]);

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
      {helperAmountLabel ? (
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
      ) : null}
    </Box>
  );
}
