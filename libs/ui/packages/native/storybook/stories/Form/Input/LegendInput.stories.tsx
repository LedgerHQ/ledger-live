import { storiesOf } from "../../storiesOf";
import { text } from "@storybook/addon-knobs";
import React from "react";
import LegendInput from "../../../../src/components/Form/Input/LegendInput";

const LegendInputStory = (): JSX.Element => {
  const [value, setValue] = React.useState("");

  const onChange = (value: string) => setValue(value);

  return (
    <LegendInput
      legend={text("label", "Ledger")}
      value={value}
      onChange={onChange}
      placeholder={"Placeholder"}
    />
  );
};

storiesOf((story) => story("Form/Input", module).add("LegendInput", LegendInputStory));
