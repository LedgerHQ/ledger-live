import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectItemText,
  SelectTrigger,
  Subheader,
  SubheaderRow,
  SubheaderTitle,
  SubheaderAction,
  Link,
} from "@ledgerhq/lumen-ui-react";

type StrategyOptionWithLabel = Readonly<{ value: number; label: string }>;

type StrategySelectProps = Readonly<{
  onValueChange: (value: string) => void;
  options: readonly StrategyOptionWithLabel[];
  value: string;
  strategyLabel: string;
  learnMoreLabel: string;
}>;

export const StrategySelect = ({
  onValueChange,
  options,
  value,
  strategyLabel,
  learnMoreLabel,
}: StrategySelectProps) => {
  return (
    <div className="flex flex-col gap-12">
      <Subheader>
        <SubheaderRow className="px-8">
          <SubheaderTitle>{strategyLabel}</SubheaderTitle>
          <SubheaderAction onClick={() => {}}>
            <Link href="#" appearance="accent" underline={false} size="md">
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
