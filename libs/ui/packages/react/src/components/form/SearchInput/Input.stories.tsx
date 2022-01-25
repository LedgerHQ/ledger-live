import React from "react";
import SearchInput from "./index";
import { InputProps } from "../BaseInput";

export default {
  title: "Form/Input/Search",
  argTypes: {
    disabled: {
      type: "boolean",
      defaultValue: false,
    },
    error: {
      type: "string",
      defaultValue: undefined,
    },
  },
};

export const Search = (args: InputProps): JSX.Element => {
  const [value, setValue] = React.useState("");

  return <SearchInput {...args} value={value} onChange={setValue} placeholder={"Placeholder"} />;
};
