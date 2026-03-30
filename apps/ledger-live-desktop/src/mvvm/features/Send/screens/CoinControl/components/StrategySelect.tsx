import {
  Link,
  Select,
  SelectContent,
  SelectItem,
  SelectItemText,
  SelectTrigger,
  Subheader,
  SubheaderRow,
  SubheaderTitle,
} from "@ledgerhq/lumen-ui-react";
import React from "react";

type StrategyOptionWithLabel = Readonly<{ value: number; label: string }>;

type StrategySelectProps = Readonly<{
  onValueChange: (value: string) => void;
  options: readonly StrategyOptionWithLabel[];
  value: string;
  strategyLabel: string;
  learnMoreLabel: string;
  onLearnMoreClick: () => void;
}>;

export const StrategySelect = ({
  onValueChange,
  options,
  value,
  strategyLabel,
  learnMoreLabel,
  onLearnMoreClick,
}: StrategySelectProps) => {
  return (
    <div className="flex flex-col gap-12">
      <Subheader>
        <div className="flex items-center gap-24">
          <SubheaderRow className="min-w-0 flex-1">
            <SubheaderTitle>{strategyLabel}</SubheaderTitle>
          </SubheaderRow>
          <Link appearance="accent" underline={false} size="md" onClick={onLearnMoreClick}>
            {learnMoreLabel}
          </Link>
        </div>
      </Subheader>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger />
        <SelectContent>
          {options.map(option => (
            <SelectItem key={option.value} value={String(option.value)}>
              <SelectItemText>{option.label}</SelectItemText>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
