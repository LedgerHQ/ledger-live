import React from "react";
import { Box, Button } from "@ledgerhq/lumen-ui-rnative";
import { applyRatio } from "../utils/applyRatio";

type RatioPickerProps = Readonly<{
  value: number;
  maxValue: number;
  onChange: (value: number) => void;
  onMax: () => void;
  disabled?: boolean;
}>;

const RATIOS = [
  { label: "25%", ratio: 0.25 },
  { label: "50%", ratio: 0.5 },
  { label: "75%", ratio: 0.75 },
];

export function RatioPicker({
  value,
  maxValue,
  onChange,
  onMax,
  disabled,
}: RatioPickerProps) {
  return (
    <Box lx={{ flexDirection: "row", gap: "s12" }}>
      {RATIOS.map(({ label, ratio }) => {
        const ratioValue = applyRatio(maxValue, ratio);
        return (
          <Button
            key={label}
            appearance="gray"
            size="sm"
            lx={{ flex: 1 }}
            disabled={disabled || maxValue === 0 || value === ratioValue}
            onPress={() => onChange(ratioValue)}
            testID={`perps-deposit-ratio-${label}`}
          >
            {label}
          </Button>
        );
      })}
      <Button
        appearance="gray"
        size="sm"
        lx={{ flex: 1 }}
        disabled={disabled || maxValue === 0}
        onPress={onMax}
        testID="perps-deposit-ratio-MAX"
      >
        MAX
      </Button>
    </Box>
  );
}
