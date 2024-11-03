import React from "react";
import AnimatedInputSelect from "../../../../src/components/Form/Input/AnimatedInputSelect";
import { action } from "@storybook/addon-actions";

export default {
  title: "Form/Input/AnimatedInputSelect",
  component: AnimatedInputSelect,
};

export const AnimatedInputSelectStory = (
  args: typeof AnimatedInputSelectStoryArgs,
): JSX.Element => {
  const [value, setValue] = React.useState("");

  const onChange = (value: string) => setValue(value);

  return (
    <AnimatedInputSelect
      error={args.error}
      disabled={args.disabled}
      value={value}
      onChange={onChange}
      placeholder={args.placeholder}
      selectProps={args.selectProps}
    />
  );
};
AnimatedInputSelectStory.storyName = "AnimatedInputSelect";

const AnimatedInputSelectStoryArgs = {
  error: "",
  disabled: false,
  placeholder: "Edit Tag",
  selectProps: {
    onPressSelect: action("Select"),
    text: "Tag type",
  },
};
AnimatedInputSelectStory.args = AnimatedInputSelectStoryArgs;
