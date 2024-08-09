import { Flex, Input, Text } from "@ledgerhq/react-ui";
import React from "react";

export const InputRow = ({
  title,
  desc,
  value,
  onChange,
  visible = true,
  disabled = false,
}: {
  title: string;
  desc: string;
  value: string;
  onChange: (value: string) => void;
  visible?: boolean;
  disabled?: boolean;
}) => {
  if (!visible) return null;
  return (
    <Flex flexDirection="column" mb={2}>
      <Text mb={2}>{title}</Text>
      <Input placeholder={desc} value={value} onChange={onChange} disabled={disabled} />
    </Flex>
  );
};
