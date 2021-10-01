import { storiesOf } from "@storybook/react-native";
import { withKnobs } from "@storybook/addon-knobs";
import React from "react";
import CenterView from "../../CenterView";
import { InputProps } from "../../../../src/components/Form/Input/BaseInput";
import QrCodeInput from "../../../../src/components/Form/Input/QrCodeInput";

const QrCodeInputStory = (args: InputProps): JSX.Element => {
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

storiesOf("Form", module)
  .addDecorator(withKnobs)
  .addDecorator((getStory) => <CenterView>{getStory()}</CenterView>)
  .add("Input/QrCodeInput", () => <QrCodeInputStory />);
