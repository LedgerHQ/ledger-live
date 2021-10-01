import React, { useMemo } from "react";
import type { ButtonProps } from "@ui/components/cta/Button";
import Button from "@ui/components/cta/Button";

export interface ToggleProps extends Omit<ButtonProps, "type"> {
  checked?: boolean;
}

enum TypeEnum {
  ENABLED = "primary",
  DISABLED = "secondary",
}

const Toggle = ({ checked = true, ...buttonProps }: ToggleProps) => {
  const type = useMemo(() => (checked ? TypeEnum.ENABLED : TypeEnum.DISABLED), [checked]);
  return <Button type={type} {...buttonProps} />;
};

export default Toggle;
