import { storiesOf } from "../../storiesOf";
import React from "react";
import { InputProps } from "../../../../src/components/Form/Input/BaseInput";
import QrCodeInput from "../../../../src/components/Form/Input/QrCodeInput";

export const QrCodeInputStory = (args: InputProps): JSX.Element => {
  const [value, setValue] = React.useState("");

  const onChange = (value) => setValue(value);

  return (
    <QrCodeInput
      {...args}
      value={value}
      onChangeText={onChange}
      placeholder={"Placeholder"}
    />
  );
};

storiesOf((story) =>
  story("Form/Input", module).add("QrCodeInput", QrCodeInputStory)
);
