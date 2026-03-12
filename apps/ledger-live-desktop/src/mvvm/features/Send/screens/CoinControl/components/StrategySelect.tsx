import {
  Link,
  Select,
  SelectContent,
  SelectItem,
  SelectItemText,
  SelectTrigger,
  Subheader,
  SubheaderAction,
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
        <SubheaderRow className="px-8">
          <SubheaderTitle>{strategyLabel}</SubheaderTitle>
          <SubheaderAction onClick={onLearnMoreClick}>
            <Link appearance="accent" underline={false} size="md">
              {learnMoreLabel}
            </Link>
          </SubheaderAction>
        </SubheaderRow>
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
