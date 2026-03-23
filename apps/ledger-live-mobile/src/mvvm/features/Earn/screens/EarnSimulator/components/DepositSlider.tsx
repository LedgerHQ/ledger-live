import React, { useCallback } from "react";
import { View, StyleSheet } from "react-native";
import Slider from "@react-native-community/slider";
import { Text } from "@ledgerhq/native-ui";
import { useTheme } from "styled-components/native";

type Props = {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  formatValue: (value: number) => string;
  onValueChange: (value: number) => void;
};

export default function DepositSlider({
  label,
  value,
  min,
  max,
  step,
  formatValue,
  onValueChange,
}: Props) {
  const { colors } = useTheme();

  const handleValueChange = useCallback(
    (v: number) => {
      const rounded = Math.round(v / step) * step;
      onValueChange(rounded);
    },
    [step, onValueChange],
  );

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text variant="body" color="neutral.c70">
          {label}
        </Text>
        <Text variant="body" fontWeight="semiBold" color="neutral.c100">
          {formatValue(value)}
        </Text>
      </View>
      <Slider
        value={value}
        minimumValue={min}
        maximumValue={max}
        step={step}
        onValueChange={handleValueChange}
        minimumTrackTintColor={colors.neutral.c100}
        maximumTrackTintColor={colors.neutral.c40}
        thumbTintColor={colors.neutral.c100}
        style={styles.slider}
      />
      <View style={styles.row}>
        <Text variant="tiny" color="neutral.c50">
          {formatValue(min)}
        </Text>
        <Text variant="tiny" color="neutral.c50">
          {formatValue(max)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  slider: {
    height: 40,
  },
});
