import React from "react";
import { Flex, Text } from "@ledgerhq/react-ui/index";
import Select from "~/renderer/components/Select";
import { SelectOption } from "./types";

interface VerticalLabeledSelectProps<T = SelectOption> {
  label: string;
  value: T;
  options: readonly T[];
  onChange: (option: T) => void;
  width?: string;
}

export const VerticalLabeledSelect = <T extends SelectOption>({
  label,
  value,
  options,
  onChange,
  width = "250px",
}: VerticalLabeledSelectProps<T>) => {
  return (
    <Flex flexDirection="column" justifyContent="center" width={width}>
      <Text variant="body" fontSize="14px" mb="2">
        {label}
      </Text>
      <Select
        value={value}
        options={options}
        onChange={option => option && onChange(option)}
        isSearchable={false}
      />
    </Flex>
  );
};
