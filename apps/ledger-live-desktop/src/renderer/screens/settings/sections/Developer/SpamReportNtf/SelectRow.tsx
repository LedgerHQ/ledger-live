import { Flex, Text } from "@ledgerhq/react-ui";
import React from "react";
import Select from "~/renderer/components/Select";
import { SelectOption } from "./type";

export const SelectRow = ({
  title,
  desc,
  value,
  options,
  onChange,
}: {
  title: string;
  desc: string;
  options: SelectOption[];
  value: SelectOption;
  onChange: (value: SelectOption) => void;
}) => {
  const avoidEmptyValue = (option?: SelectOption | null) => option && onChange(option);
  return (
    <Flex flexDirection="column" mb={2}>
      <Text mb={2}>{title}</Text>
      <Text mb={2}>{desc}</Text>
      <Select
        onChange={avoidEmptyValue}
        options={options}
        value={value}
        isSearchable={false}
        defaultValue={options[0]}
        required
      />
    </Flex>
  );
};
