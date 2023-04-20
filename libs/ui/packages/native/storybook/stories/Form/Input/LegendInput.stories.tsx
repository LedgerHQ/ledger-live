import React from "react";
import LegendInput from "../../../../src/components/Form/Input/LegendInput";

export default {
  title: "Form/Input/LegendInput",
  component: LegendInput,
};

export const LegendInputStory = (args: typeof LegendInputStoryArgs): JSX.Element => {
  const [value, setValue] = React.useState("");

  const onChange = (value: string) => setValue(value);

  return (
    <LegendInput
      legend={args.label}
      value={value}
      onChange={onChange}
      placeholder={"Placeholder"}
    />
  );
};
LegendInputStory.storyName = "LegendInput";
const LegendInputStoryArgs = {
  label: "Ledger",
};
LegendInputStory.args = LegendInputStoryArgs;
