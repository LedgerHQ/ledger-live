import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "LLD/hooks/redux";
import {
  useFilterTokenOperationsThreshold,
  useFilterTokenOperationsZeroAmount,
} from "~/renderer/actions/settings";
import Box from "~/renderer/components/Box";
import Input from "~/renderer/components/Input";
import { counterValueCurrencySelector } from "~/renderer/reducers/settings";
import { SettingsSectionRow as Row } from "~/renderer/screens/settings/SettingsSection";

const sanitizeThresholdInput = (value: string) =>
  value.replaceAll(",", ".").replaceAll(/[^0-9.]/g, "");

export default function FilterTokenOperationsThreshold() {
  const { t } = useTranslation();
  const [isFilterEnabled] = useFilterTokenOperationsZeroAmount();
  const [threshold, setThreshold] = useFilterTokenOperationsThreshold();
  const counterValueCurrency = useSelector(counterValueCurrencySelector);

  const onChange = useCallback(
    (rawValue: string) => {
      const sanitized = sanitizeThresholdInput(rawValue);
      if (!sanitized || sanitized === ".") {
        setThreshold(0);
        return;
      }

      const parsedValue = Number.parseFloat(sanitized);
      if (Number.isFinite(parsedValue)) setThreshold(parsedValue);
    },
    [setThreshold],
  );

  if (!isFilterEnabled) {
    return null;
  }

  return (
    <Row
      title={t("settings.accounts.filterTokenOperationsThreshold.title")}
      desc={t("settings.accounts.filterTokenOperationsThreshold.desc", {
        ticker: counterValueCurrency.ticker,
      })}
    >
      <Box horizontal alignItems="center">
        <Box style={{ width: 110 }}>
          <Input
            value={String(threshold)}
            onChange={onChange}
            inputMode="decimal"
            data-testid="input-filter-token-operations-threshold"
          />
        </Box>
        <Box ml={2} ff="Inter|SemiBold" color="neutral.c70" fontSize={3}>
          {counterValueCurrency.ticker}
        </Box>
      </Box>
    </Row>
  );
}
