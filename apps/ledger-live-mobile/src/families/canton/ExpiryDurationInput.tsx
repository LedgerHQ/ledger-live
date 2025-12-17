import React, { useMemo, useCallback, useState } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "@react-navigation/native";

import type { Transaction as CantonTransaction } from "@ledgerhq/live-common/families/canton/types";
import type { ExpiryDurationInputProps } from "LLM/features/ExpiryDuration/types";
import LText from "~/components/LText";

const DURATION_OPTIONS = [
  { seconds: 3 * 60 * 60, labelKey: "canton.expiryDuration.threeHours" },
  { seconds: 6 * 60 * 60, labelKey: "canton.expiryDuration.sixHours" },
  { seconds: 24 * 60 * 60, labelKey: "canton.expiryDuration.oneDay" },
  { seconds: 7 * 24 * 60 * 60, labelKey: "canton.expiryDuration.oneWeek" },
  { seconds: 30 * 24 * 60 * 60, labelKey: "canton.expiryDuration.oneMonth" },
];

const DEFAULT_SECONDS = 24 * 60 * 60;

const ExpiryDurationInput = ({ onChange, testID }: ExpiryDurationInputProps<CantonTransaction>) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [selectedSeconds, setSelectedSeconds] = useState(DEFAULT_SECONDS);

  const selectedOption = useMemo(
    () => DURATION_OPTIONS.find(opt => opt.seconds === selectedSeconds) ?? DURATION_OPTIONS[2],
    [selectedSeconds],
  );

  const handleSelectDuration = useCallback(
    (seconds: number) => {
      setSelectedSeconds(seconds);
      const patch = (tx: CantonTransaction) => ({ ...tx, expireInSeconds: seconds });
      onChange({ value: seconds, patch });
    },
    [onChange],
  );

  return (
    <View style={styles.container} testID={testID}>
      <LText semiBold style={styles.label}>
        {t("canton.expiryDuration.label")}
      </LText>
      <View style={styles.optionsRow}>
        {DURATION_OPTIONS.map(option => {
          const isSelected = option.seconds === selectedOption.seconds;
          return (
            <TouchableOpacity
              key={option.seconds}
              style={[
                styles.option,
                {
                  backgroundColor: isSelected ? colors.primary : colors.card,
                  borderColor: isSelected ? colors.primary : colors.border,
                },
              ]}
              onPress={() => handleSelectDuration(option.seconds)}
              testID={`expiry-duration-option-${option.seconds}`}
            >
              <LText
                semiBold={isSelected}
                style={[styles.optionText, { color: isSelected ? colors.white : colors.text }]}
              >
                {t(option.labelKey)}
              </LText>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
  label: {
    fontSize: 14,
    marginBottom: 18,
  },
  optionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  option: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  optionText: {
    fontSize: 13,
  },
});

export default ExpiryDurationInput;
