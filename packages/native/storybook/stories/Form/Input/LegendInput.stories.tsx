import { storiesOf } from "@storybook/react-native";
import { text, withKnobs } from "@storybook/addon-knobs";
import React from "react";
import CenterView from "../../CenterView";
import LegendInput from "../../../../src/components/Form/Input/LegendInput";

const LegendInputStory = (): JSX.Element => {
  const [value, setValue] = React.useState("");

  const onChange = (value) => setValue(value);

  return (
    <LegendInput
      legend={text("label", "Ledger")}
      value={value}
      onChangeText={onChange}
      placeholder={"Placeholder"}
    />
  );
};

storiesOf("Form", module)
  .addDecorator(withKnobs)
  .addDecorator((getStory) => <CenterView>{getStory()}</CenterView>)
  .add("Input/LegendInput", () => <LegendInputStory />);
