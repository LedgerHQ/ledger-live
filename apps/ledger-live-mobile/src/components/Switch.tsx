import React from "react";
import { Switch as RNSwitch } from "@ledgerhq/native-ui";

type SwitchProps = {
  value: boolean;
  onValueChange?: (_: boolean) => void;
  disabled?: boolean;
  label?: string;
};

export default function Switch({
  value,
  onValueChange,
  ...props
}: SwitchProps) {
  return <RNSwitch checked={value} onChange={onValueChange} {...props} />;
}
