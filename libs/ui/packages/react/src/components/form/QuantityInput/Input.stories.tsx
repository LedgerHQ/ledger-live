import React from "react";
import QuantityInput from "./index";
import { InputProps } from "../BaseInput";

export default {
  title: "Form/Input/Quantity",
  argTypes: {
    disabled: {
      type: "boolean",
      defaultValue: false,
    },
    error: {
      type: "string",
      defaultValue: undefined,
    },
    max: {
      type: "number",
      defaultValue: 349,
    },
    min: {
      type: "number",
      defaultValue: 0,
    },
  },
};

export const Quantity = ({
  min,
  max,
  ...otherArgs
}: InputProps & { max: number; min: number }): JSX.Element => {
  const [value, setValue] = React.useState("");

  const onChange = (val: string) => {
    if (val) {
      let value = parseInt(val);
      if (value > max) value = max;
      if (value < min) value = min;
      setValue("" + value);
    }
  };

  const onMaxClick = () => {
    setValue("" + max);
  };

  return (
    <QuantityInput
      {...otherArgs}
      value={value}
      onChange={onChange}
      onMaxClick={onMaxClick}
      placeholder={"Placeholder"}
      price={"#Price"}
      max={max}
      min={min}
    />
  );
};
