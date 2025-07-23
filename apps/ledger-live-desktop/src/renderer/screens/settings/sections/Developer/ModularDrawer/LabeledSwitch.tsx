import React from "react";
import { Flex, Text } from "@ledgerhq/react-ui/index";
import Switch from "~/renderer/components/Switch";

interface LabeledSwitchProps {
  label: string;
  isChecked: boolean;
  onChange: (checked: boolean) => void;
}

export const LabeledSwitch: React.FC<LabeledSwitchProps> = ({ label, isChecked, onChange }) => {
  return (
    <Flex flexDirection="row" alignItems="center">
      <Text variant="body" fontSize="14px" mr="2">
        {label}
      </Text>
      <Switch isChecked={isChecked} onChange={onChange} />
    </Flex>
  );
};
