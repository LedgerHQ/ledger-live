import {
  Box,
  Link,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectItemText,
  SelectTrigger,
  SelectValue,
  Subheader,
  SubheaderRow,
  SubheaderTitle,
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
    <Box lx={{ flexDirection: "column", gap: "s12", paddingHorizontal: "s8" }}>
      <Subheader>
        <Box>
          <SubheaderRow lx={{ flexDirection: "row", justifyContent: "space-between" }}>
            <SubheaderTitle>{strategyLabel}</SubheaderTitle>
            <Link appearance="accent" underline={false} onPress={onLearnMorePress} size="md">
              {learnMoreLabel}
            </Link>
          </SubheaderRow>
        </Box>
      </Subheader>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup lx={{ marginBottom: "s24" }}>
            {options.map(option => (
              <SelectItem key={option.value} value={String(option.value)}>
                <SelectItemText>{option.label}</SelectItemText>
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </Box>
  );
};
