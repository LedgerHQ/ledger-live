import React from "react";
import { Switch as RNSwitch } from "@ledgerhq/native-ui";
import type { SwitchProps as RNSwitchProps } from "@ledgerhq/native-ui/components/Form/Switch";

type SwitchProps = {
  value: boolean;
  onValueChange?: (_: boolean) => void;
} & Omit<RNSwitchProps, "checked">;

export default function Switch(props: SwitchProps) {
  const { value, onValueChange, ...rest } = props;
  return <RNSwitch checked={value} onChange={onValueChange} {...rest} />;
}
