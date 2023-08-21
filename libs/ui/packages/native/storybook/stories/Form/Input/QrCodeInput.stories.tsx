import React from "react";
import QrCodeInput from "../../../../src/components/Form/Input/QrCodeInput";

export default {
  title: "Form/Input/QrCodeInput",
  component: QrCodeInput,
};

export const QrCodeInputStory = (): JSX.Element => {
  const [value, setValue] = React.useState("");

  const onChange = (value: string) => setValue(value);

  return <QrCodeInput value={value} onChange={onChange} placeholder={"Placeholder"} />;
};
QrCodeInputStory.storyName = "QrCodeInput";
