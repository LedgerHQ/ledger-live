import React from "react";
import LegendInput, { Props as LegendInputProps } from "./index";

export default {
  title: "Form/Input/Legend",
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

export const Legend = (args: LegendInputProps): JSX.Element => {
  const [value, setValue] = React.useState("");

  return <LegendInput {...args} value={value} onChange={setValue} placeholder={"Placeholder"} />;
};
