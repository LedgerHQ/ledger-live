import {
  Link,
  Select,
  SelectContent,
  SelectItem,
  SelectItemText,
  SelectTrigger,
  SelectValue,
  Subheader,
  SubheaderAction,
  SubheaderRow,
  SubheaderTitle,
  Box,
} from "@ledgerhq/lumen-ui-rnative";
import React from "react";

type StrategyOptionWithLabel = Readonly<{ value: number; label: string }>;

type StrategySelectProps = Readonly<{
  onValueChange: (value: string) => void;
  options: readonly StrategyOptionWithLabel[];
  value: string;
  strategyLabel: string;
  learnMoreLabel: string;
  onLearnMorePress: () => void;
}>;

export const StrategySelect = ({
  onValueChange,
  options,
  value,
  strategyLabel,
  learnMoreLabel,
  onLearnMorePress,
}: StrategySelectProps) => {
  return (
    <Box lx={{ flexDirection: "column", gap: "s12" }}>
      <Subheader>
        <SubheaderRow>
          <SubheaderTitle>{strategyLabel}</SubheaderTitle>
          <SubheaderAction onPress={onLearnMorePress}>
            <Link appearance="accent" underline={false} size="md">
              {learnMoreLabel}
            </Link>
          </SubheaderAction>
        </SubheaderRow>
      </Subheader>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map(option => (
            <SelectItem key={option.value} value={String(option.value)}>
              <SelectItemText>{option.label}</SelectItemText>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Box>
  );
};
