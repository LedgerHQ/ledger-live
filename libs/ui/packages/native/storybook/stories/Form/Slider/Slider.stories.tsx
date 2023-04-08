import React, { useState } from "react";
import Slider from "../../../../src/components/Form/Slider";
import FlexBox from "../../../../src/components/Layout/Flex";

export default {
  title: "Form/Slider",
  component: Slider,
};

export const SliderStory = (args: typeof SliderStoryArgs) => {
  const [value, setValue] = useState(35);

  const onChange = (value: number) => setValue(value);

  return (
    <FlexBox p={20} width={1}>
      <Slider
        value={value}
        onChange={onChange}
        disabled={args.disabled}
        min={args.min}
        max={args.max}
        step={args.step}
      />
    </FlexBox>
  );
};
SliderStory.storyName = "Slider";
const SliderStoryArgs = {
  disabled: false,
  min: 0,
  max: 100,
  step: 1,
};
SliderStory.args = SliderStoryArgs;
SliderStory.argTypes = {
  min: {
    control: {
      type: "number",
      min: 0,
      max: 10000000,
    },
  },
  max: {
    control: {
      type: "number",
      min: 0,
      max: 10000000,
    },
  },
  step: {
    control: {
      type: "number",
      min: 0,
      max: 10000000,
    },
  },
};
