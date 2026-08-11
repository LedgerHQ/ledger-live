import React from "react";
import { Button } from "@ledgerhq/lumen-ui-react";
import { cn } from "LLD/utils/cn";
import { applyRatio } from "../utils/applyRatio";

type RatioPickerProps = Readonly<{
  value: number;
  maxValue: number;
  onChange: (value: number) => void;
  onMax: () => void;
  disabled?: boolean;
  className?: string;
}>;

export function RatioPicker({
  value,
  maxValue,
  onChange,
  onMax,
  disabled,
  className,
}: RatioPickerProps) {
  const ratioOptions = [
    { label: "25%", value: applyRatio(maxValue, 0.25) },
    { label: "50%", value: applyRatio(maxValue, 0.5) },
    { label: "75%", value: applyRatio(maxValue, 0.75) },
  ];

  return (
    <div className={cn("flex items-center justify-center gap-16", className)}>
      {ratioOptions.map(option => (
        <Button
          appearance="gray"
          key={option.label}
          disabled={disabled || maxValue === 0 || value === option.value}
          onClick={() => onChange(option.value)}
          data-testid={`perps-deposit-ratio-${option.label}`}
        >
          {option.label}
        </Button>
      ))}
      <Button
        appearance="gray"
        disabled={disabled || maxValue === 0 || value === maxValue}
        onClick={onMax}
        data-testid="perps-deposit-ratio-MAX"
      >
        MAX
      </Button>
    </div>
  );
}
