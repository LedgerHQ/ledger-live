import React, { useMemo } from "react";
import type { ButtonProps } from "../Button";
import Button from "../Button";

export interface ToggleProps extends Omit<ButtonProps, "type"> {
  checked?: boolean;
}

enum TypeEnum {
  ENABLED = "main",
  DISABLED = "color",
}

const Toggle = ({ checked = true, ...buttonProps }: ToggleProps) => {
  const type = useMemo(() => (checked ? TypeEnum.ENABLED : TypeEnum.DISABLED), [checked]);
  return <Button variant={type} outline={type === TypeEnum.ENABLED} {...buttonProps} />;
};

export default Toggle;
