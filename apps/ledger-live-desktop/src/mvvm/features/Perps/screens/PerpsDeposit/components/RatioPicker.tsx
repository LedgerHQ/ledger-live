import React from "react";
import { Button } from "@ledgerhq/lumen-ui-react";
import { cn } from "LLD/utils/cn";
import { applyRatio } from "../utils/applyRatio";

type RatioPickerProps = Readonly<{
  value: number;
  maxValue: number;
  decimalPlaces: number;
  onChange: (value: number) => void;
  onMax: () => void;
  className?: string;
}>;

export function RatioPicker({
  value,
  maxValue,
  decimalPlaces,
  onChange,
  onMax,
  className,
}: RatioPickerProps) {
  const ratioOptions = [
    { label: "25%", value: applyRatio(maxValue, 0.25, decimalPlaces) },
    { label: "50%", value: applyRatio(maxValue, 0.5, decimalPlaces) },
    { label: "75%", value: applyRatio(maxValue, 0.75, decimalPlaces) },
  ];

  // MAX rounds down like the pills, so compare against the value it will actually set.
  const maxOption = applyRatio(maxValue, 1, decimalPlaces);

  return (
    <div className={cn("flex items-center justify-center gap-16", className)}>
      {ratioOptions.map(option => (
        <Button
          appearance="gray"
          key={option.label}
          disabled={maxValue === 0 || value === option.value}
          onClick={() => onChange(option.value)}
          data-testid={`perps-deposit-ratio-${option.label}`}
        >
          {option.label}
        </Button>
      ))}
      <Button
        appearance="gray"
        disabled={maxValue === 0 || value === maxOption}
        onClick={onMax}
        data-testid="perps-deposit-ratio-MAX"
      >
        MAX
      </Button>
    </div>
  );
}
