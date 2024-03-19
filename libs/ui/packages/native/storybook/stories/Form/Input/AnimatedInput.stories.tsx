import React from "react";
import AnimatedInput from "../../../../src/components/Form/Input/AnimatedInput";
import Paste from "@ledgerhq/icons-ui/native/Paste";
import Button from "../../../../src/components/cta/Button";

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
AnimatedInputStory.storyName = "AnimatedInput";

const AnimatedInputStoryArgs = {
  error: "",
  disabled: false,
  placeholder: "Placeholder",
};
AnimatedInputStory.args = AnimatedInputStoryArgs;

export const AnimatedInputWithCtaStory = (args: typeof AnimatedInputStoryArgs): JSX.Element => {
  const [value, setValue] = React.useState("");

  const onChange = (value: string) => setValue(value);

  return (
    <AnimatedInput
      error={args.error}
      disabled={args.disabled}
      value={value}
      onChange={onChange}
      placeholder={args.placeholder}
      renderRight={<Button Icon={<Paste size="S" />} isNewIcon style={{ width: "auto" }} />}
    />
  );
};
AnimatedInputWithCtaStory.storyName = "AnimatedInputWithCtaStory";
AnimatedInputWithCtaStory.args = AnimatedInputStoryArgs;
