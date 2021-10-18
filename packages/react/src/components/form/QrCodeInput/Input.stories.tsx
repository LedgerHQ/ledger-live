import React from "react";
import QrCodeInput from "./index";
import { InputProps } from "../BaseInput";

export default {
  title: "Form/Input/Qrcode",
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

export const Qrcode = (args: InputProps): JSX.Element => {
  const [value, setValue] = React.useState("");

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => setValue(e.target.value);

  return <QrCodeInput {...args} value={value} onChange={onChange} placeholder={"Placeholder"} />;
};
