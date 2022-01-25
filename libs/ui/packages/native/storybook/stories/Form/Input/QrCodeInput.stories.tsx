import { storiesOf } from "../../storiesOf";
import React from "react";
import QrCodeInput from "../../../../src/components/Form/Input/QrCodeInput";

const QrCodeInputStory = (): JSX.Element => {
  const [value, setValue] = React.useState("");

  const onChange = (value: string) => setValue(value);

  return <QrCodeInput value={value} onChange={onChange} placeholder={"Placeholder"} />;
};

storiesOf((story) => story("Form/Input", module).add("QrCodeInput", QrCodeInputStory));
