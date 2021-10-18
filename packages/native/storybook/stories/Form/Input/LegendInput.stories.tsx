import { storiesOf } from "../../storiesOf";
import { text } from "@storybook/addon-knobs";
import React from "react";
import LegendInput from "../../../../src/components/Form/Input/LegendInput";

export const LegendInputStory = (): JSX.Element => {
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

storiesOf((story) =>
  story("Form/Input", module).add("LegendInput", LegendInputStory)
);
