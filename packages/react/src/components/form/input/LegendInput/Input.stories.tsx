import React from "react";
import LegendInput, { Props as LegendInputProps } from "./index";

export default {
  title: "Form/Input/LegendInput",
  argTypes: {
    disabled: {
      type: "boolean",
      defaultValue: false,
    },
    error: {
      type: "string",
      defaultValue: undefined,
    },
    legend: {
      type: "string",
      defaultValue: "#Legend",
    },
  },
};

export const LegendInputDefault = (args: LegendInputProps): JSX.Element => {
  const [value, setValue] = React.useState("");

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => setValue(e.target.value);

  return <LegendInput {...args} value={value} onChange={onChange} placeholder={"Placeholder"} />;
};
