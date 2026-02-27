import React, { memo, useCallback } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { useTheme } from "@react-navigation/native";
import { useTranslation } from "~/context/Locale";
import { useSelector, useDispatch } from "~/context/hooks";
import SettingsRow from "~/components/SettingsRow";
import LText from "~/components/LText";
import { setFilterTokenOperationsThreshold } from "~/actions/settings";
import {
  counterValueCurrencySelector,
  filterTokenOperationsThresholdSelector,
  filterTokenOperationsZeroAmountEnabledSelector,
} from "~/reducers/settings";

const sanitizeThresholdInput = (value: string) => value.replace(/,/g, ".").replace(/[^0-9.]/g, "");

function FilterTokenOperationsThresholdRow() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const dispatch = useDispatch();

  const isFilterEnabled = useSelector(filterTokenOperationsZeroAmountEnabledSelector);
  const threshold = useSelector(filterTokenOperationsThresholdSelector);
  const counterValueCurrency = useSelector(counterValueCurrencySelector);

  const onChangeText = useCallback(
    (rawValue: string) => {
      const sanitized = sanitizeThresholdInput(rawValue);
      if (!sanitized || sanitized === ".") {
        dispatch(setFilterTokenOperationsThreshold(0));
        return;
      }

      const parsedValue = Number.parseFloat(sanitized);
      if (Number.isFinite(parsedValue)) dispatch(setFilterTokenOperationsThreshold(parsedValue));
    },
    [dispatch],
  );

  if (!isFilterEnabled) return null;

  return (
    <SettingsRow
      event="FilterTokenOperationsThresholdRow"
      title={t("settings.display.filterTokenOperationsThreshold")}
      desc={t("settings.display.filterTokenOperationsThresholdDesc", {
        ticker: counterValueCurrency.ticker,
      })}
    >
      <View style={styles.controls}>
        <TextInput
          value={String(threshold)}
          onChangeText={onChangeText}
          keyboardType="decimal-pad"
          style={[styles.input, { borderColor: colors.border, color: colors.text }]}
          testID="filter-token-operations-threshold-input"
        />
        <LText semiBold style={styles.ticker}>
          {counterValueCurrency.ticker}
        </LText>
      </View>
    </SettingsRow>
  );
}

const styles = StyleSheet.create({
  controls: {
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    minWidth: 84,
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 8,
    textAlign: "right",
  },
  ticker: {
    marginLeft: 8,
  },
});

export default memo(FilterTokenOperationsThresholdRow);
