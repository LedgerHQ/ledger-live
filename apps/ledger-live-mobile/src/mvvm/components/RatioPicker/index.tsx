import React from "react";
import { Box, Button } from "@ledgerhq/lumen-ui-rnative";
import { applyRatio } from "./applyRatio";

export { applyRatio };

type RatioPickerProps = Readonly<{
  value: number;
  maxValue: number;
  decimalPlaces: number;
  onChange: (value: number) => void;
  onMax: () => void;
  testIDPrefix: string;
  disabled?: boolean;
}>;

const RATIOS = [
  { label: "25%", ratio: 0.25 },
  { label: "50%", ratio: 0.5 },
  { label: "75%", ratio: 0.75 },
];

const MAX_LABEL = "MAX";

/**
 * Percentage pills that fill an amount field with a share of `maxValue`.
 * A pill is disabled once the field already holds the value it would set.
 */
export function RatioPicker({
  value,
  maxValue,
  decimalPlaces,
  onChange,
  onMax,
  testIDPrefix,
  disabled,
}: RatioPickerProps) {
  const maxOption = applyRatio(maxValue, 1, decimalPlaces);

  return (
    <Box lx={{ flexDirection: "row", gap: "s12" }}>
      {RATIOS.map(({ label, ratio }) => {
        const ratioValue = applyRatio(maxValue, ratio, decimalPlaces);
        return (
          <Button
            key={label}
            appearance="gray"
            size="sm"
            lx={{ flex: 1 }}
            disabled={disabled || maxValue === 0 || value === ratioValue}
            onPress={() => onChange(ratioValue)}
            testID={`${testIDPrefix}-${label}`}
          >
            {label}
          </Button>
        );
      })}
      <Button
        appearance="gray"
        size="sm"
        lx={{ flex: 1 }}
        disabled={disabled || maxValue === 0 || value === maxOption}
        onPress={onMax}
        testID={`${testIDPrefix}-${MAX_LABEL}`}
      >
        {MAX_LABEL}
      </Button>
    </Box>
  );
}
