import React from "react";
import { Flex, Switch, Text } from "@ledgerhq/native-ui";

interface ToggleRowProps {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  description?: string;
}

export const ToggleRow = ({ label, value, onChange, description }: ToggleRowProps) => (
  <Flex flexDirection="row" alignItems="center" justifyContent="space-between" py={2}>
    <Flex flex={1} mr={4}>
      <Text variant="body" fontWeight="medium" color="neutral.c100">
        {label}
      </Text>
      {description && (
        <Text variant="small" color="neutral.c70" mt={1}>
          {description}
        </Text>
      )}
    </Flex>
    <Switch checked={value} onChange={onChange} />
  </Flex>
);
