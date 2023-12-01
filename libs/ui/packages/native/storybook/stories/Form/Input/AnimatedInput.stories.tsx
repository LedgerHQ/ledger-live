import React from "react";
import AnimatedInput from "../../../../src/components/Form/Input/AnimatedInput";

export default {
  title: "Form/Input/AnimatedInput",
  component: AnimatedInput,
};

export const AnimatedInputStory = (args: typeof AnimatedInputStoryArgs): JSX.Element => {
  const [value, setValue] = React.useState("");

  const onChange = (value: string) => setValue(value);

  return (
    <AnimatedInput
      error={args.error}
      disabled={args.disabled}
      value={value}
      onChange={onChange}
      placeholder={args.placeholder}
    />
  );
};
AnimatedInputStory.storyName = "LegendInput";
const AnimatedInputStoryArgs = {
  error: "",
  disabled: false,
  placeholder: "Placeholder",
};
AnimatedInputStory.args = AnimatedInputStoryArgs;
